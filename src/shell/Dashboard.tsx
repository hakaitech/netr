// ============================================================================
// DASHBOARD — Main layout shell with GridStack-managed applet grid
// ============================================================================

import {
  createSignal,
  createEffect,
  onMount,
  onCleanup,
  Suspense,
  ErrorBoundary,
  lazy,
} from 'solid-js';
import { render as solidRender } from 'solid-js/web';
import { GridStack } from 'gridstack';
import type {
  BoardConfig,
  AppletPlacement,
  AppletProps,
  AppletModule,
  AppletServices,
} from '../core/applet.contract';
import { createServices } from '../services/index';
import { saveBoard, loadActiveBoard, setActiveBoard } from './BoardStore';
import { DEFAULT_BOARD } from './presets';
import { createBuiltinRegistry } from '../core/builtin-registry';
import TopBar from './TopBar';
import AppletCatalog from './AppletCatalog';

// ---------------------------------------------------------------------------
// Plugin registry — single source of truth for all applets
// ---------------------------------------------------------------------------

const registry = createBuiltinRegistry();

// ---------------------------------------------------------------------------
// Loading skeleton shown while an applet chunk downloads
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div class="flex h-full w-full items-center justify-center bg-surface-1">
      <div class="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error fallback when an applet crashes
// ---------------------------------------------------------------------------

function AppletErrorFallback(props: { error: unknown; appletId: string }) {
  const message =
    props.error instanceof Error ? props.error.message : 'Unknown error';
  return (
    <div class="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-1 p-4 text-center">
      <span class="text-sm font-medium text-danger">Applet crashed</span>
      <span class="text-xs text-text-secondary">{props.appletId}</span>
      <p class="max-w-xs text-xs text-text-secondary">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AppletHost — renders a single applet inside a gridstack cell
// ---------------------------------------------------------------------------

function AppletHost(props: {
  appletId: string;
  instanceId: string;
  services: AppletServices;
  width: number;
  height: number;
  config?: Record<string, unknown>;
}) {
  const loader = registry.getLoader(props.appletId);
  if (!loader) {
    return (
      <div class="flex h-full w-full items-center justify-center bg-surface-1 text-xs text-danger">
        Unknown applet: {props.appletId}
      </div>
    );
  }

  const LazyApplet = lazy(async () => {
    const mod = await loader();
    return { default: mod.default };
  });

  return (
    <ErrorBoundary
      fallback={(err) => (
        <AppletErrorFallback error={err} appletId={props.appletId} />
      )}
    >
      <Suspense fallback={<LoadingSkeleton />}>
        <LazyApplet
          services={props.services}
          instanceId={props.instanceId}
          width={props.width}
          height={props.height}
          initialState={props.config}
        />
      </Suspense>
    </ErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// Tracked mount — we pair every solidRender with a dispose function
// ---------------------------------------------------------------------------

interface MountedApplet {
  instanceId: string;
  appletId: string;
  dispose: () => void;
  el: HTMLElement;
}

// ---------------------------------------------------------------------------
// Dashboard component
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const [board, setBoard] = createSignal<BoardConfig>(structuredClone(DEFAULT_BOARD));
  const [catalogOpen, setCatalogOpen] = createSignal(false);
  const services = createServices();

  let gridRef!: HTMLDivElement;
  let grid: GridStack;
  const mounted = new Map<string, MountedApplet>();

  // Flag to prevent gridstack change events from re-triggering sync
  let suppressSync = false;

  // --- Persistence: load saved board on startup ---

  onMount(async () => {
    const saved = await loadActiveBoard();
    if (saved) {
      setBoard(saved);
    }
    initGrid();
  });

  // --- Initialize GridStack ---

  function initGrid() {
    const b = board();
    grid = GridStack.init(
      {
        column: b.columns,
        cellHeight: b.rowHeight,
        margin: b.gap,
        float: true,
        animate: true,
        removable: false,
        disableOneColumnMode: true,
      },
      gridRef,
    );

    // Sync layout changes back to board state
    grid.on('change', (_event: Event, items: any) => {
      if (suppressSync || !items) return;
      setBoard((prev) => {
        const updated = { ...prev, applets: [...prev.applets], updatedAt: Date.now() };
        for (const item of items) {
          const idx = updated.applets.findIndex(
            (a) => a.instanceId === item.id,
          );
          if (idx !== -1) {
            updated.applets[idx] = {
              ...updated.applets[idx],
              position: {
                col: item.x ?? 0,
                row: item.y ?? 0,
                w: item.w ?? 1,
                h: item.h ?? 1,
              },
            };
          }
        }
        return updated;
      });
    });

    // Render initial applets
    syncGridItems(b.applets);
  }

  // --- Sync grid items: add/remove widgets to match board config ---

  function syncGridItems(applets: AppletPlacement[]) {
    suppressSync = true;

    const desiredIds = new Set(applets.map((a) => a.instanceId));

    // Remove widgets no longer in config
    for (const [instanceId, entry] of mounted) {
      if (!desiredIds.has(instanceId)) {
        entry.dispose();
        grid.removeWidget(entry.el, false);
        mounted.delete(instanceId);
      }
    }

    // Add new widgets
    for (const placement of applets) {
      if (mounted.has(placement.instanceId)) continue;
      addWidgetToGrid(placement);
    }

    suppressSync = false;
  }

  // --- Add a single widget to the grid and mount Solid into it ---

  function addWidgetToGrid(placement: AppletPlacement) {
    const { appletId, instanceId, position, config } = placement;

    // Create the DOM element GridStack needs
    const contentEl = document.createElement('div');
    contentEl.classList.add('grid-stack-item-content');

    const itemEl = document.createElement('div');
    itemEl.classList.add('grid-stack-item');
    itemEl.setAttribute('gs-id', instanceId);
    itemEl.setAttribute('gs-x', String(position.col));
    itemEl.setAttribute('gs-y', String(position.row));
    itemEl.setAttribute('gs-w', String(position.w));
    itemEl.setAttribute('gs-h', String(position.h));
    itemEl.appendChild(contentEl);

    // Look up min/max size from registry
    const manifest = registry.getManifest(appletId);
    if (manifest) {
      itemEl.setAttribute('gs-min-w', String(manifest.minSize.w));
      itemEl.setAttribute('gs-min-h', String(manifest.minSize.h));
      if (manifest.maxSize) {
        itemEl.setAttribute('gs-max-w', String(manifest.maxSize.w));
        itemEl.setAttribute('gs-max-h', String(manifest.maxSize.h));
      }
      if (!manifest.resizable) {
        itemEl.setAttribute('gs-no-resize', 'true');
      }
    }

    // Add to GridStack
    grid.addWidget(itemEl);

    // Mount Solid component into the content element
    const dispose = solidRender(
      () => (
        <AppletHost
          appletId={appletId}
          instanceId={instanceId}
          services={services}
          width={position.w}
          height={position.h}
          config={config}
        />
      ),
      contentEl,
    );

    mounted.set(instanceId, { instanceId, appletId, dispose, el: itemEl });
  }

  // --- Add applet from catalog ---

  function addApplet(appletId: string) {
    const manifest = registry.getManifest(appletId);
    if (!manifest) return;

    const instanceId = `${appletId}-${Date.now().toString(36)}`;
    const placement: AppletPlacement = {
      appletId,
      instanceId,
      position: {
        col: 0,
        row: 0,
        w: manifest.defaultSize.w,
        h: manifest.defaultSize.h,
      },
    };

    setBoard((prev) => ({
      ...prev,
      applets: [...prev.applets, placement],
      updatedAt: Date.now(),
    }));

    addWidgetToGrid(placement);
  }

  // --- Remove applet ---

  function removeApplet(instanceId: string) {
    const entry = mounted.get(instanceId);
    if (entry) {
      entry.dispose();
      grid.removeWidget(entry.el, false);
      mounted.delete(instanceId);
    }

    setBoard((prev) => ({
      ...prev,
      applets: prev.applets.filter((a) => a.instanceId !== instanceId),
      updatedAt: Date.now(),
    }));
  }

  // --- React to board changes: re-sync grid and persist ---

  createEffect(() => {
    const b = board();

    // Persist to IndexedDB (fire-and-forget)
    saveBoard(b).then(() => setActiveBoard(b.id));
  });

  // --- Handle full board swap (preset, load) ---

  function handleBoardChange(newBoard: BoardConfig) {
    // Tear down existing widgets
    for (const [, entry] of mounted) {
      entry.dispose();
    }
    mounted.clear();
    grid.removeAll(false);

    // Update state
    setBoard(newBoard);

    // Reconfigure grid
    grid.column(newBoard.columns);
    grid.cellHeight(newBoard.rowHeight);
    grid.margin(newBoard.gap);

    // Re-render
    syncGridItems(newBoard.applets);
  }

  // --- Cleanup on unmount ---

  onCleanup(() => {
    for (const [, entry] of mounted) {
      entry.dispose();
    }
    mounted.clear();
    if (grid) grid.destroy(false);
  });

  return (
    <div class="h-screen flex flex-col bg-surface-0 text-text-primary">
      <TopBar
        board={board()}
        onToggleCatalog={() => setCatalogOpen((v) => !v)}
        onBoardChange={handleBoardChange}
      />
      <div class="flex-1 relative overflow-hidden">
        <div class="h-full overflow-auto p-2">
          <div ref={gridRef!} class="grid-stack" />
        </div>
        <AppletCatalog
          open={catalogOpen()}
          onClose={() => setCatalogOpen(false)}
          onAddApplet={addApplet}
          manifests={registry.getManifests()}
        />
      </div>
    </div>
  );
}
