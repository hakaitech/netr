// ============================================================================
// FLIGHT TRACKER — Live aircraft positions from OpenSky Network
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
import type { Aircraft, AircraftCategory } from '../../core/types';

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

export const manifest: AppletManifest = {
  id: 'flight-tracker',
  name: 'Flight Tracker',
  description: 'Live aircraft positions from OpenSky Network',
  category: 'infrastructure',
  icon: 'plane',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 10000,
  requiresMap: true,
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OPENSKY_URL = 'https://opensky-network.org/api/states/all';
const POLL_MS = 10_000;
const CACHE_TTL = 10_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OpenSkyState = [
  string,        // 0  icao24
  string | null, // 1  callsign
  string,        // 2  origin_country
  number | null, // 3  time_position
  number | null, // 4  last_contact
  number | null, // 5  longitude
  number | null, // 6  latitude
  number | null, // 7  baro_altitude
  boolean,       // 8  on_ground
  number | null, // 9  velocity
  number | null, // 10 true_track (heading)
  number | null, // 11 vertical_rate
  unknown,       // 12 sensors
  number | null, // 13 geo_altitude
  string | null, // 14 squawk
  boolean,       // 15 spi
  number,        // 16 position_source
  number,        // 17 category
];

interface OpenSkyResponse {
  time: number;
  states: OpenSkyState[] | null;
}

type ConnectionStatus = 'connecting' | 'connected' | 'rate-limited' | 'error';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function classifyAircraft(callsign: string | null): AircraftCategory {
  if (!callsign || callsign.trim() === '') return 'unknown';
  const cs = callsign.trim().toUpperCase();
  // Military-style prefixes (common patterns)
  const milPrefixes = ['RCH', 'DUKE', 'EVAC', 'REACH', 'FORGE', 'HUNT', 'VIPER'];
  if (milPrefixes.some((p) => cs.startsWith(p))) return 'military';
  // Cargo carriers
  const cargoPrefixes = ['FDX', 'UPS', 'GTI', 'ABX', 'ATN'];
  if (cargoPrefixes.some((p) => cs.startsWith(p))) return 'cargo';
  return 'commercial';
}

function parseStates(data: OpenSkyResponse): Aircraft[] {
  if (!data.states) return [];
  const result: Aircraft[] = [];

  for (const s of data.states) {
    const lat = s[6];
    const lng = s[5];
    // Skip entries without valid position
    if (lat == null || lng == null) continue;

    const callsign = s[1]?.trim() ?? '';
    result.push({
      icao24: s[0],
      callsign,
      originCountry: s[2],
      lat,
      lng,
      altitude: s[7] ?? 0,
      velocity: s[9] ?? 0,
      heading: s[10] ?? 0,
      verticalRate: s[11] ?? 0,
      onGround: s[8],
      lastContact: s[4] ?? 0,
      category: classifyAircraft(s[1]),
    });
  }

  return result;
}

function formatAltitude(meters: number): string {
  const feet = Math.round(meters * 3.28084);
  if (feet >= 10000) return `FL${Math.round(feet / 100)}`;
  return `${feet.toLocaleString()} ft`;
}

function formatSpeed(ms: number): string {
  const knots = Math.round(ms * 1.94384);
  return `${knots} kts`;
}

function aircraftDotColor(ac: Aircraft): [number, number, number, number] {
  if (ac.onGround) return [100, 100, 100, 160];
  if (ac.category === 'military' || ac.category === 'unknown') return [239, 68, 68, 200];
  if (ac.category === 'cargo') return [245, 158, 11, 200];
  return [59, 130, 246, 200]; // blue for commercial
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FlightTracker: Component<AppletProps> = (props) => {
  const [aircraft, setAircraft] = createSignal<Aircraft[]>([]);
  const [status, setStatus] = createSignal<ConnectionStatus>('connecting');
  const [lastUpdate, setLastUpdate] = createSignal<number>(0);

  // Derived stats
  const totalCount = () => aircraft().length;
  const airborneCount = () => aircraft().filter((a) => !a.onGround).length;
  const groundCount = () => aircraft().filter((a) => a.onGround).length;
  const countryCount = () => new Set(aircraft().map((a) => a.originCountry)).size;

  // Show top 200 in list for performance
  const displayList = () => aircraft().filter((a) => !a.onGround).slice(0, 200);

  // -- Fetch ----------------------------------------------------------------

  async function fetchAircraft() {
    try {
      const data = await props.services.http.get<OpenSkyResponse>(OPENSKY_URL, {
        cacheTtl: CACHE_TTL,
        timeout: 30_000,
      });
      const parsed = parseStates(data);
      setAircraft(parsed);
      setStatus('connected');
      setLastUpdate(Date.now());
      props.services.eventBus.emit('aircraft:update', parsed);
    } catch (err) {
      // Preserve existing data if we have it
      if (aircraft().length > 0) {
        setStatus('rate-limited');
      } else {
        setStatus(
          err instanceof Error && err.message.includes('429')
            ? 'rate-limited'
            : 'error',
        );
      }
    }
  }

  // -- Map layers -----------------------------------------------------------

  createEffect(() => {
    const data = aircraft();
    if (data.length === 0) {
      props.services.mapService.removeLayers(props.instanceId);
      return;
    }

    // Only show airborne aircraft on map
    const airborne = data.filter((a) => !a.onGround);

    const layer = new ScatterplotLayer({
      id: `${props.instanceId}-aircraft`,
      data: airborne,
      getPosition: (d: Aircraft) => [d.lng, d.lat],
      getRadius: 4,
      getFillColor: (d: Aircraft) => aircraftDotColor(d),
      radiusMinPixels: 2,
      radiusMaxPixels: 6,
      radiusUnits: 'pixels' as const,
      opacity: 0.9,
      pickable: true,
    });

    props.services.mapService.setLayers(props.instanceId, [layer]);
  });

  // -- Lifecycle ------------------------------------------------------------

  let interval: ReturnType<typeof setInterval>;

  onMount(() => {
    fetchAircraft();
    interval = setInterval(fetchAircraft, POLL_MS);
  });

  onCleanup(() => {
    clearInterval(interval);
    props.services.mapService.removeLayers(props.instanceId);
  });

  // -- Status helpers -------------------------------------------------------

  function statusText(): string {
    switch (status()) {
      case 'connecting':
        return 'Connecting to OpenSky...';
      case 'connected':
        return '';
      case 'rate-limited':
        return 'Rate limited, retrying...';
      case 'error':
        return 'Data unavailable';
    }
  }

  function statusColor(): string {
    switch (status()) {
      case 'connecting':
        return 'text-text-secondary';
      case 'connected':
        return 'text-emerald-400';
      case 'rate-limited':
        return 'text-amber-400';
      case 'error':
        return 'text-red-400';
    }
  }

  // -- Render ---------------------------------------------------------------

  return (
    <div class="flex flex-col h-full bg-surface-1 text-text-primary">
      {/* Header */}
      <div class="px-3 py-2 border-b border-border shrink-0">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold tracking-wide uppercase">
            Flight Tracker
          </h2>
          <Show when={status() !== 'connecting'}>
            <div class="flex items-center gap-1.5">
              <span
                class={`w-2 h-2 rounded-full ${
                  status() === 'connected'
                    ? 'bg-emerald-400'
                    : status() === 'rate-limited'
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                }`}
              />
              <span class="text-[10px] text-text-secondary">
                {status() === 'connected' ? 'Live' : statusText()}
              </span>
            </div>
          </Show>
        </div>
      </div>

      {/* Stats bar */}
      <Show when={status() === 'connecting'}>
        <div class="flex items-center justify-center flex-1 text-text-secondary text-sm">
          {statusText()}
        </div>
      </Show>

      <Show when={status() !== 'connecting' && aircraft().length === 0}>
        <div class="flex items-center justify-center flex-1">
          <p class={`text-sm ${statusColor()}`}>{statusText()}</p>
        </div>
      </Show>

      <Show when={aircraft().length > 0}>
        {/* Summary stats */}
        <div class="grid grid-cols-3 gap-2 px-3 py-2 border-b border-border shrink-0">
          <div class="text-center">
            <div class="text-lg font-bold tabular-nums">
              {totalCount().toLocaleString()}
            </div>
            <div class="text-[10px] text-text-secondary uppercase tracking-wide">
              Total
            </div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold tabular-nums text-blue-400">
              {airborneCount().toLocaleString()}
            </div>
            <div class="text-[10px] text-text-secondary uppercase tracking-wide">
              Airborne
            </div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold tabular-nums text-text-secondary">
              {countryCount()}
            </div>
            <div class="text-[10px] text-text-secondary uppercase tracking-wide">
              Countries
            </div>
          </div>
        </div>

        {/* Ground / airborne bar */}
        <div class="flex items-center gap-1 px-3 py-1.5 border-b border-border shrink-0">
          <div
            class="h-1.5 rounded-full bg-blue-500 transition-all"
            style={{
              width: `${totalCount() > 0 ? (airborneCount() / totalCount()) * 100 : 0}%`,
            }}
          />
          <div
            class="h-1.5 rounded-full bg-surface-3 transition-all"
            style={{
              width: `${totalCount() > 0 ? (groundCount() / totalCount()) * 100 : 0}%`,
            }}
          />
        </div>

        {/* Rate-limit warning */}
        <Show when={status() === 'rate-limited'}>
          <div class="px-3 py-1.5 text-[10px] text-amber-400 bg-amber-900/20 border-b border-border shrink-0">
            Rate limited -- showing cached data, retrying...
          </div>
        </Show>

        {/* Scrollable aircraft list */}
        <div class="flex-1 overflow-y-auto min-h-0">
          <div class="text-[10px] text-text-secondary px-3 py-1 border-b border-border">
            Showing {displayList().length} airborne of {totalCount().toLocaleString()} total
          </div>
          <ul class="divide-y divide-border">
            <For each={displayList()}>
              {(ac) => (
                <li class="flex items-center gap-3 px-3 py-2 hover:bg-surface-2 transition-colors">
                  {/* Callsign */}
                  <div class="shrink-0 w-20">
                    <span class="text-sm font-mono font-semibold">
                      {ac.callsign || ac.icao24.toUpperCase()}
                    </span>
                  </div>

                  {/* Country */}
                  <div class="shrink-0 w-16 text-xs text-text-secondary truncate">
                    {ac.originCountry}
                  </div>

                  {/* Altitude */}
                  <div class="flex-1 text-xs text-right tabular-nums">
                    {ac.altitude > 0 ? formatAltitude(ac.altitude) : 'GND'}
                  </div>

                  {/* Speed */}
                  <div class="shrink-0 w-16 text-xs text-right tabular-nums text-text-secondary">
                    {ac.velocity > 0 ? formatSpeed(ac.velocity) : '--'}
                  </div>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>
    </div>
  );
};

export default FlightTracker;
