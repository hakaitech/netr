// ============================================================================
// HURRICANE TRACKER — Tropical storm monitoring with forecast tracks
// ============================================================================

import { Component, createMemo, For, Show } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, Badge, usePolling, useMapLayer, createPathLayer,
} from '../../sdk';

export const manifest: AppletManifest = {
  id: 'hurricane-tracker',
  name: 'Hurricane Tracker',
  description: 'Tropical storm tracking with forecast paths and category data',
  category: 'environment',
  icon: 'wind',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 300_000,
  requiresMap: true,
};

interface TrackPoint { lat: number; lng: number; time: string; }

interface Storm {
  id: string;
  name: string;
  category: 'TD' | 'TS' | '1' | '2' | '3' | '4' | '5';
  lat: number;
  lng: number;
  maxWindMph: number;
  movementDir: string;
  basin: string;
  track: TrackPoint[];
}

const CAT_VARIANT: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  '5': 'danger', '4': 'danger', '3': 'warning', '2': 'warning', '1': 'info', TS: 'info', TD: 'default',
};

const CAT_COLOR: Record<string, [number, number, number, number]> = {
  '5': [190, 30, 45, 240], '4': [239, 68, 68, 220], '3': [245, 158, 11, 220],
  '2': [250, 204, 21, 200], '1': [96, 165, 250, 200], TS: [147, 197, 253, 180], TD: [180, 180, 180, 160],
};

const MOCK: Storm[] = [
  {
    id: 'h1', name: 'Hurricane Marlena', category: '4', lat: 22.3, lng: -68.5, maxWindMph: 145, movementDir: 'NW at 12 mph', basin: 'Atlantic',
    track: [
      { lat: 18.0, lng: -60.0, time: '2026-03-14T00:00Z' }, { lat: 19.5, lng: -63.0, time: '2026-03-15T00:00Z' },
      { lat: 21.0, lng: -66.0, time: '2026-03-16T00:00Z' }, { lat: 22.3, lng: -68.5, time: '2026-03-17T00:00Z' },
      { lat: 24.0, lng: -70.5, time: '2026-03-18T12:00Z' }, { lat: 26.5, lng: -72.0, time: '2026-03-19T12:00Z' },
    ],
  },
  {
    id: 'h2', name: 'Typhoon Kenzo', category: '5', lat: 16.8, lng: 132.5, maxWindMph: 175, movementDir: 'WNW at 15 mph', basin: 'W. Pacific',
    track: [
      { lat: 13.0, lng: 140.0, time: '2026-03-13T00:00Z' }, { lat: 14.5, lng: 137.0, time: '2026-03-14T12:00Z' },
      { lat: 15.5, lng: 135.0, time: '2026-03-15T12:00Z' }, { lat: 16.8, lng: 132.5, time: '2026-03-17T00:00Z' },
      { lat: 18.5, lng: 129.0, time: '2026-03-18T12:00Z' }, { lat: 21.0, lng: 126.0, time: '2026-03-20T00:00Z' },
    ],
  },
  {
    id: 'h3', name: 'Cyclone Anaya', category: '2', lat: -15.2, lng: 58.0, maxWindMph: 105, movementDir: 'S at 8 mph', basin: 'Indian',
    track: [
      { lat: -12.0, lng: 60.0, time: '2026-03-14T00:00Z' }, { lat: -13.5, lng: 59.0, time: '2026-03-15T12:00Z' },
      { lat: -15.2, lng: 58.0, time: '2026-03-17T00:00Z' }, { lat: -17.0, lng: 57.0, time: '2026-03-18T12:00Z' },
      { lat: -19.5, lng: 55.5, time: '2026-03-20T00:00Z' },
    ],
  },
  {
    id: 'h4', name: 'Tropical Storm Violet', category: 'TS', lat: 28.0, lng: -88.0, maxWindMph: 60, movementDir: 'NE at 10 mph', basin: 'Gulf',
    track: [
      { lat: 25.0, lng: -90.0, time: '2026-03-15T00:00Z' }, { lat: 26.5, lng: -89.0, time: '2026-03-16T00:00Z' },
      { lat: 28.0, lng: -88.0, time: '2026-03-17T12:00Z' }, { lat: 30.0, lng: -86.5, time: '2026-03-18T12:00Z' },
    ],
  },
  {
    id: 'h5', name: 'TD Eleven', category: 'TD', lat: 10.5, lng: -32.0, maxWindMph: 35, movementDir: 'W at 18 mph', basin: 'Atlantic',
    track: [
      { lat: 10.0, lng: -28.0, time: '2026-03-16T00:00Z' }, { lat: 10.3, lng: -30.0, time: '2026-03-17T00:00Z' },
      { lat: 10.5, lng: -32.0, time: '2026-03-18T00:00Z' }, { lat: 10.8, lng: -35.0, time: '2026-03-19T00:00Z' },
    ],
  },
];

function fetchMock(): Promise<Storm[]> {
  return new Promise((r) => setTimeout(() => r(MOCK), 200));
}

const HurricaneTracker: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling<Storm[]>(fetchMock, 300_000);
  const items = createMemo(() => data() ?? []);

  useMapLayer(props, () => {
    const d = items();
    if (!d.length) return null;
    return [createPathLayer(`${props.instanceId}-tracks`, d, {
      getPath: (s: Storm) => s.track.map((p) => [p.lng, p.lat]),
      getColor: (s: Storm) => CAT_COLOR[s.category] ?? [150, 150, 150, 200],
      widthMinPixels: 3,
    })];
  });

  return (
    <AppletShell
      title="Hurricane Tracker"
      status={loading() ? 'loading' : error() ? 'error' : 'connected'}
      statusText={`${items().length} active storms`}
    >
      <Show when={loading()}>
        <div class="flex items-center justify-center h-32 text-text-secondary text-sm">Loading...</div>
      </Show>
      <Show when={!loading() && !error()}>
        <ul class="divide-y divide-border">
          <For each={items()}>
            {(storm) => (
              <li class="px-3 py-2.5 hover:bg-surface-2 transition-colors">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold">{storm.name}</span>
                    <Badge text={`CAT ${storm.category}`} variant={CAT_VARIANT[storm.category]} />
                  </div>
                  <span class="text-xs text-text-secondary">{storm.basin}</span>
                </div>
                <div class="mt-1 flex items-center gap-3 text-xs text-text-secondary">
                  <span>Max wind: {storm.maxWindMph} mph</span>
                  <span>{storm.movementDir}</span>
                </div>
                <div class="text-[10px] text-text-secondary mt-0.5">
                  Position: {storm.lat.toFixed(1)}, {storm.lng.toFixed(1)} &middot; {storm.track.length} track points
                </div>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </AppletShell>
  );
};

export default HurricaneTracker;
