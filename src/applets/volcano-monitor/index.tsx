// ============================================================================
// VOLCANO MONITOR — Volcanic activity tracking with alert levels
// ============================================================================

import { Component, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, DataList, StatGrid, Badge, usePolling, useMapLayer,
  createScatterLayer,
} from '../../sdk';

export const manifest: AppletManifest = {
  id: 'volcano-monitor',
  name: 'Volcano Monitor',
  description: 'Global volcanic activity with alert level tracking',
  category: 'environment',
  icon: 'mountain',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 600_000,
  requiresMap: true,
};

type AlertLevel = 'normal' | 'advisory' | 'watch' | 'warning';

interface Volcano {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  alertLevel: AlertLevel;
  lastEruption: string;
  elevationM: number;
  type: 'stratovolcano' | 'shield' | 'caldera';
}

const ALERT_VARIANT: Record<AlertLevel, 'success' | 'info' | 'warning' | 'danger'> = {
  normal: 'success', advisory: 'info', watch: 'warning', warning: 'danger',
};

const ALERT_COLOR: Record<AlertLevel, [number, number, number, number]> = {
  normal: [34, 197, 94, 180], advisory: [96, 165, 250, 200],
  watch: [245, 158, 11, 220], warning: [239, 68, 68, 240],
};

const MOCK: Volcano[] = [
  { id: 'v1', name: 'Kilauea', country: 'US', lat: 19.42, lng: -155.29, alertLevel: 'watch', lastEruption: '2023-06-07', elevationM: 1247, type: 'shield' },
  { id: 'v2', name: 'Mount Etna', country: 'IT', lat: 37.75, lng: 14.99, alertLevel: 'advisory', lastEruption: '2024-08-14', elevationM: 3357, type: 'stratovolcano' },
  { id: 'v3', name: 'Popocatepetl', country: 'MX', lat: 19.02, lng: -98.62, alertLevel: 'warning', lastEruption: '2025-12-01', elevationM: 5426, type: 'stratovolcano' },
  { id: 'v4', name: 'Sakurajima', country: 'JP', lat: 31.58, lng: 130.66, alertLevel: 'watch', lastEruption: '2026-01-15', elevationM: 1117, type: 'stratovolcano' },
  { id: 'v5', name: 'Merapi', country: 'ID', lat: -7.54, lng: 110.45, alertLevel: 'warning', lastEruption: '2025-11-20', elevationM: 2930, type: 'stratovolcano' },
  { id: 'v6', name: 'Taal', country: 'PH', lat: 14.00, lng: 120.99, alertLevel: 'advisory', lastEruption: '2024-03-26', elevationM: 311, type: 'caldera' },
  { id: 'v7', name: 'Fagradalsfjall', country: 'IS', lat: 63.90, lng: -22.27, alertLevel: 'watch', lastEruption: '2026-02-10', elevationM: 385, type: 'shield' },
  { id: 'v8', name: 'Stromboli', country: 'IT', lat: 38.79, lng: 15.21, alertLevel: 'advisory', lastEruption: '2024-07-03', elevationM: 924, type: 'stratovolcano' },
  { id: 'v9', name: 'Mauna Loa', country: 'US', lat: 19.48, lng: -155.61, alertLevel: 'normal', lastEruption: '2022-12-10', elevationM: 4169, type: 'shield' },
  { id: 'v10', name: 'Piton de la Fournaise', country: 'FR', lat: -21.24, lng: 55.71, alertLevel: 'normal', lastEruption: '2024-09-15', elevationM: 2632, type: 'shield' },
  { id: 'v11', name: 'Cotopaxi', country: 'EC', lat: -0.68, lng: -78.44, alertLevel: 'advisory', lastEruption: '2023-10-21', elevationM: 5897, type: 'stratovolcano' },
  { id: 'v12', name: 'Eyjafjallajokull', country: 'IS', lat: 63.63, lng: -19.62, alertLevel: 'normal', lastEruption: '2010-04-14', elevationM: 1651, type: 'stratovolcano' },
  { id: 'v13', name: 'Nyiragongo', country: 'CD', lat: -1.52, lng: 29.25, alertLevel: 'warning', lastEruption: '2025-05-22', elevationM: 3470, type: 'stratovolcano' },
];

function fetchMock(): Promise<Volcano[]> {
  return new Promise((r) => setTimeout(() => r(MOCK), 200));
}

const VolcanoMonitor: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling<Volcano[]>(fetchMock, 600_000);
  const items = createMemo(() => data() ?? []);

  const stats = createMemo(() => {
    const d = items();
    const elevated = d.filter((v) => v.alertLevel !== 'normal').length;
    return [
      { label: 'Monitored', value: d.length },
      { label: 'Elevated Alerts', value: elevated, color: 'text-amber-400' },
      { label: 'Warnings', value: d.filter((v) => v.alertLevel === 'warning').length, color: 'text-red-400' },
    ];
  });

  useMapLayer(props, () => {
    const d = items();
    if (!d.length) return null;
    return [createScatterLayer(`${props.instanceId}-volcanoes`, d, {
      getPosition: (v: Volcano) => [v.lng, v.lat],
      getRadius: 40000,
      getFillColor: (v: Volcano) => ALERT_COLOR[v.alertLevel],
      radiusMinPixels: 5,
      radiusMaxPixels: 16,
    })];
  });

  return (
    <AppletShell
      title="Volcano Monitor"
      status={loading() ? 'loading' : error() ? 'error' : 'connected'}
      statusText={`${items().length} volcanoes`}
      toolbar={<StatGrid stats={stats()} columns={3} />}
    >
      <DataList
        items={items}
        loading={loading}
        error={error}
        renderItem={(volcano) => (
          <div class="flex items-start gap-3 px-3 py-2 hover:bg-surface-2 transition-colors">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium truncate">{volcano.name}</p>
                <Badge text={volcano.alertLevel} variant={ALERT_VARIANT[volcano.alertLevel]} />
              </div>
              <p class="text-xs text-text-secondary mt-0.5">
                {volcano.country} &middot; {volcano.type} &middot; {volcano.elevationM.toLocaleString()}m
              </p>
              <p class="text-[10px] text-text-secondary">
                Last eruption: {volcano.lastEruption}
              </p>
            </div>
          </div>
        )}
      />
    </AppletShell>
  );
};

export default VolcanoMonitor;
