// ============================================================================
// DECK MAP — Interactive map displaying layers from other applets
// ============================================================================

import {
  Component,
  createSignal,
  createEffect,
  onMount,
  onCleanup,
  Show,
} from 'solid-js';
import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { Layer } from '@deck.gl/core';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

export const manifest: AppletManifest = {
  id: 'deck-map',
  name: 'Live Map',
  description: 'Interactive map displaying layers from other applets',
  category: 'geo',
  icon: 'map',
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 3, h: 2 },
  resizable: true,
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASEMAP_STYLE =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const INITIAL_VIEW = {
  center: [0, 20] as [number, number],
  zoom: 2,
  pitch: 0,
  bearing: 0,
};

const DEBOUNCE_MS = 150;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DeckMap: Component<AppletProps> = (props) => {
  let containerRef!: HTMLDivElement;
  let map: maplibregl.Map | null = null;
  let overlay: MapboxOverlay | null = null;
  let viewStateTimer: ReturnType<typeof setTimeout> | undefined;

  const [cursorLat, setCursorLat] = createSignal<number | null>(null);
  const [cursorLng, setCursorLng] = createSignal<number | null>(null);
  const [zoom, setZoom] = createSignal(INITIAL_VIEW.zoom);
  const [ready, setReady] = createSignal(false);

  // -- Initialize map -------------------------------------------------------

  onMount(() => {
    map = new maplibregl.Map({
      container: containerRef,
      style: BASEMAP_STYLE,
      center: INITIAL_VIEW.center,
      zoom: INITIAL_VIEW.zoom,
      pitch: INITIAL_VIEW.pitch,
      bearing: INITIAL_VIEW.bearing,
      attributionControl: false,
      antialias: true,
    });

    // Add minimal attribution in bottom-right
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right',
    );

    // Create Deck.gl overlay
    overlay = new MapboxOverlay({
      layers: [],
    });

    map.addControl(overlay as unknown as maplibregl.IControl);

    // Track cursor position
    map.on('mousemove', (e) => {
      setCursorLat(e.lngLat.lat);
      setCursorLng(e.lngLat.lng);
    });

    map.on('mouseleave', () => {
      setCursorLat(null);
      setCursorLng(null);
    });

    // Track zoom
    map.on('zoom', () => {
      if (map) setZoom(map.getZoom());
    });

    // Emit debounced view state changes
    map.on('moveend', () => {
      if (!map) return;
      clearTimeout(viewStateTimer);
      viewStateTimer = setTimeout(() => {
        if (!map) return;
        const center = map.getCenter();
        props.services.eventBus.emit('map:viewstate', {
          longitude: center.lng,
          latitude: center.lat,
          zoom: map.getZoom(),
          pitch: map.getPitch(),
          bearing: map.getBearing(),
        });
      }, DEBOUNCE_MS);
    });

    // Handle click events
    map.on('click', (e) => {
      const pickInfo = overlay?.pickObject({
        x: e.point.x,
        y: e.point.y,
        radius: 10,
      });

      props.services.eventBus.emit('map:click', {
        lat: e.lngLat.lat,
        lng: e.lngLat.lng,
        object: pickInfo?.object ?? undefined,
      });
    });

    // Register layer change handler with MapService
    props.services.mapService.setLayerChangeHandler((layers: Layer[]) => {
      if (overlay) {
        overlay.setProps({ layers });
      }
    });

    map.on('load', () => {
      setReady(true);
    });
  });

  // -- Handle resize when width/height props change -------------------------

  createEffect(() => {
    // Access reactive props to create dependency
    const _w = props.width;
    const _h = props.height;
    // Defer resize to next frame so the container has updated dimensions
    if (map) {
      requestAnimationFrame(() => {
        map?.resize();
      });
    }
  });

  // -- Cleanup --------------------------------------------------------------

  onCleanup(() => {
    clearTimeout(viewStateTimer);

    if (overlay) {
      overlay.finalize();
      overlay = null;
    }

    if (map) {
      map.remove();
      map = null;
    }
  });

  // -- Render ---------------------------------------------------------------

  return (
    <div class="relative w-full h-full bg-surface-1">
      {/* Map container — wrapper keeps absolute positioning since MapLibre overrides to relative */}
      <div class="absolute inset-0 overflow-hidden">
        <div ref={containerRef!} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Loading overlay */}
      <Show when={!ready()}>
        <div class="absolute inset-0 flex items-center justify-center bg-surface-1/80 z-10">
          <span class="text-sm text-text-secondary">Loading map...</span>
        </div>
      </Show>

      {/* Coordinate / zoom overlay */}
      <div class="absolute bottom-8 left-2 z-10 pointer-events-none">
        <div class="bg-surface-1/80 backdrop-blur-sm rounded px-2 py-1 text-[10px] font-mono text-text-secondary tabular-nums">
          <span>Z{zoom().toFixed(1)}</span>
          <Show when={cursorLat() !== null && cursorLng() !== null}>
            <span class="ml-2">
              {cursorLat()!.toFixed(4)}, {cursorLng()!.toFixed(4)}
            </span>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default DeckMap;
