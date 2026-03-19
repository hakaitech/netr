// ============================================================================
// POI BOOKMARKS — Save and manage map bookmarks with map layer visualization
// ============================================================================

import { Component, createSignal, For, Show } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import { AppletShell, useAppletState, useEventBus, useMapLayer, createScatterLayer } from '../../sdk';

export const manifest: AppletManifest = {
  id: 'poi-bookmarks',
  name: 'POI Bookmarks',
  description: 'Save named map bookmarks and visualize them on the map',
  category: 'geo',
  icon: 'bookmark',
  defaultSize: { w: 2, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  requiresMap: true,
};

interface Bookmark {
  id: string;
  name: string;
  lat: number;
  lng: number;
  createdAt: number;
}

const POIBookmarks: Component<AppletProps> = (props) => {
  const [state, setState] = useAppletState<{ bookmarks: Bookmark[] }>(props, { bookmarks: [] });
  const [pendingLat, setPendingLat] = createSignal<number | null>(null);
  const [pendingLng, setPendingLng] = createSignal<number | null>(null);
  const [name, setName] = createSignal('');

  useEventBus(props, 'map:click', (e) => {
    setPendingLat(e.lat);
    setPendingLng(e.lng);
  });

  const { emit: emitView } = useEventBus(props, 'map:viewstate', () => {});

  useMapLayer(props, () => {
    const bm = state().bookmarks;
    if (bm.length === 0) return null;
    return [createScatterLayer(`${props.instanceId}-bookmarks`, bm, {
      getPosition: (d: Bookmark) => [d.lng, d.lat],
      getRadius: 6,
      radiusUnits: 'pixels' as const,
      getFillColor: () => [99, 102, 241, 220] as [number, number, number, number],
      radiusMinPixels: 6,
      radiusMaxPixels: 12,
      pickable: true,
    })];
  });

  function addBookmark() {
    const lat = pendingLat();
    const lng = pendingLng();
    if (lat === null || lng === null) return;
    const bm: Bookmark = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name().trim() || `Point ${state().bookmarks.length + 1}`,
      lat, lng,
      createdAt: Date.now(),
    };
    setState({ bookmarks: [...state().bookmarks, bm] });
    setName('');
    setPendingLat(null);
    setPendingLng(null);
  }

  function removeBookmark(id: string) {
    setState({ bookmarks: state().bookmarks.filter(b => b.id !== id) });
  }

  function goTo(bm: Bookmark) {
    emitView({ latitude: bm.lat, longitude: bm.lng, zoom: 14, pitch: 0, bearing: 0 });
  }

  return (
    <AppletShell title="Bookmarks" statusText={`${state().bookmarks.length} saved`}>
      <div class="px-3 py-2 border-b border-border space-y-2 shrink-0">
        <p class="text-xs text-text-secondary">Click the map to capture a location, then save it.</p>
        <Show when={pendingLat() !== null}>
          <div class="text-xs text-accent">Captured: {pendingLat()!.toFixed(5)}, {pendingLng()!.toFixed(5)}</div>
        </Show>
        <div class="flex gap-1.5">
          <input
            type="text" value={name()} onInput={(e) => setName(e.currentTarget.value)}
            placeholder="Bookmark name..."
            class="flex-1 bg-surface-2 text-text-primary text-sm rounded px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-text-secondary"
          />
          <button
            onClick={addBookmark}
            disabled={pendingLat() === null}
            class="px-3 py-1 rounded text-xs font-medium bg-accent text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/80 transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      <Show when={state().bookmarks.length === 0}>
        <div class="flex items-center justify-center h-20 text-text-secondary text-sm">No bookmarks yet</div>
      </Show>
      <ul class="divide-y divide-border">
        <For each={state().bookmarks}>
          {(bm) => (
            <li class="flex items-center gap-2 px-3 py-2 hover:bg-surface-2 transition-colors">
              <div class="flex-1 min-w-0">
                <p class="text-sm truncate">{bm.name}</p>
                <p class="text-xs text-text-secondary">{bm.lat.toFixed(5)}, {bm.lng.toFixed(5)}</p>
              </div>
              <button onClick={() => goTo(bm)} class="text-xs text-accent hover:underline shrink-0">Go</button>
              <button onClick={() => removeBookmark(bm.id)} class="text-xs text-red-400 hover:underline shrink-0">Del</button>
            </li>
          )}
        </For>
      </ul>
    </AppletShell>
  );
};

export default POIBookmarks;
