// ============================================================================
// EARTHQUAKE MONITOR — Live USGS earthquake feed with magnitude visualization
// ============================================================================

import {
  Component,
  createSignal,
  createEffect,
  onMount,
  onCleanup,
  For,
  Show,
} from 'solid-js';
import { ScatterplotLayer } from '@deck.gl/layers';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import type { Earthquake } from '../../core/types';

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

export const manifest: AppletManifest = {
  id: 'earthquake-feed',
  name: 'Earthquake Monitor',
  description: 'Live USGS earthquake feed with magnitude visualization',
  category: 'environment',
  icon: 'activity',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 60000,
  requiresMap: true,
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USGS_URL =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson';
const POLL_MS = 60_000;
const CACHE_TTL = 60_000;

type MagFilter = 2.5 | 4.5 | 6;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface USGSFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    url: string;
    tsunami: number;
  };
  geometry: {
    coordinates: [number, number, number]; // [lng, lat, depth]
  };
}

interface USGSResponse {
  features: USGSFeature[];
}

function parseQuakes(data: USGSResponse): Earthquake[] {
  return (data.features ?? []).map((f) => ({
    id: f.id,
    lng: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
    depth: f.geometry.coordinates[2],
    magnitude: f.properties.mag,
    place: f.properties.place ?? 'Unknown',
    time: f.properties.time,
    url: f.properties.url,
    tsunami: f.properties.tsunami === 1,
  }));
}

function magColor(mag: number): string {
  if (mag >= 6) return 'bg-danger';
  if (mag >= 4.5) return 'bg-warning';
  return 'bg-yellow-400';
}

function magColorRgb(mag: number): [number, number, number, number] {
  if (mag >= 6) return [239, 68, 68, 200];
  if (mag >= 4.5) return [245, 158, 11, 200];
  return [250, 204, 21, 180];
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const EarthquakeFeed: Component<AppletProps> = (props) => {
  const [quakes, setQuakes] = createSignal<Earthquake[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [filter, setFilter] = createSignal<MagFilter>(2.5);

  const filtered = () => quakes().filter((q) => q.magnitude >= filter());

  // -- Fetch ----------------------------------------------------------------

  async function fetchQuakes() {
    try {
      const data = await props.services.http.get<USGSResponse>(USGS_URL, {
        cacheTtl: CACHE_TTL,
      });
      const parsed = parseQuakes(data);
      parsed.sort((a, b) => b.time - a.time);
      setQuakes(parsed);
      setError(null);
      props.services.eventBus.emit('earthquake:update', parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }

  // -- Map layers -----------------------------------------------------------

  createEffect(() => {
    const data = filtered();
    if (data.length === 0) {
      props.services.mapService.removeLayers(props.instanceId);
      return;
    }

    const layer = new ScatterplotLayer({
      id: `${props.instanceId}-earthquakes`,
      data,
      getPosition: (d: Earthquake) => [d.lng, d.lat],
      getRadius: (d: Earthquake) => Math.pow(2, d.magnitude) * 800,
      getFillColor: (d: Earthquake) => magColorRgb(d.magnitude),
      radiusMinPixels: 3,
      radiusMaxPixels: 80,
      opacity: 0.8,
      pickable: true,
    });

    props.services.mapService.setLayers(props.instanceId, [layer]);
  });

  // -- Lifecycle ------------------------------------------------------------

  let interval: ReturnType<typeof setInterval>;

  onMount(() => {
    fetchQuakes();
    interval = setInterval(fetchQuakes, POLL_MS);
  });

  onCleanup(() => {
    clearInterval(interval);
    props.services.mapService.removeLayers(props.instanceId);
  });

  // -- Render ---------------------------------------------------------------

  return (
    <div class="flex flex-col h-full bg-surface-1 text-text-primary">
      {/* Header */}
      <div class="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <h2 class="text-sm font-semibold tracking-wide uppercase">
          Earthquakes
        </h2>
        <select
          class="bg-surface-2 text-text-primary text-xs rounded px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-accent"
          value={filter()}
          onChange={(e) => setFilter(Number(e.currentTarget.value) as MagFilter)}
        >
          <option value={2.5}>M2.5+</option>
          <option value={4.5}>M4.5+</option>
          <option value={6}>M6+</option>
        </select>
      </div>

      {/* Body */}
      <div class="flex-1 overflow-y-auto min-h-0">
        <Show when={loading()}>
          <div class="flex items-center justify-center h-full text-text-secondary text-sm">
            Loading earthquake data...
          </div>
        </Show>

        <Show when={!loading() && error()}>
          <div class="flex items-center justify-center h-full text-danger text-sm px-4 text-center">
            {error()}
          </div>
        </Show>

        <Show when={!loading() && !error()}>
          <div class="text-xs text-text-secondary px-3 py-1.5 border-b border-border">
            {filtered().length} events
          </div>
          <ul class="divide-y divide-border">
            <For each={filtered()}>
              {(quake) => (
                <li>
                  <a
                    href={quake.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-start gap-3 px-3 py-2.5 hover:bg-surface-2 transition-colors"
                  >
                    {/* Magnitude badge */}
                    <span
                      class={`shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold text-white ${magColor(quake.magnitude)}`}
                    >
                      {quake.magnitude.toFixed(1)}
                    </span>

                    <div class="min-w-0 flex-1">
                      <p class="text-sm leading-snug truncate">
                        {quake.place}
                      </p>
                      <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-xs text-text-secondary">
                          {timeAgo(quake.time)}
                        </span>
                        <span class="text-xs text-text-secondary">
                          {quake.depth.toFixed(1)} km deep
                        </span>
                        <Show when={quake.tsunami}>
                          <span class="text-xs text-danger font-medium">
                            TSUNAMI
                          </span>
                        </Show>
                      </div>
                    </div>
                  </a>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>
    </div>
  );
};

export default EarthquakeFeed;
