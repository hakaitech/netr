// ============================================================================
// POWER GRID — Regional power grid status monitor
// ============================================================================

import { Component, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, StatGrid, DataList, Badge,
  usePolling, useMapLayer, useFilter,
  createScatterLayer, formatNumber,
} from '../../sdk';

export const manifest: AppletManifest = {
  id: 'power-grid',
  name: 'Power Grid',
  description: 'Regional power grid status and utilization',
  category: 'infrastructure',
  icon: 'zap',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 30000,
  requiresMap: true,
};

interface GridRegion {
  id: string; name: string; load: number; capacity: number; utilization: number;
  status: 'normal' | 'strained' | 'critical'; lat: number; lng: number;
}

const STATUS_COLOR: Record<string, [number, number, number, number]> = {
  normal:   [34, 197, 94, 200],
  strained: [249, 115, 22, 200],
  critical: [239, 68, 68, 220],
};

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'danger'> = {
  normal: 'success', strained: 'warning', critical: 'danger',
};

const MOCK: GridRegion[] = [
  { id: 'ercot', name: 'ERCOT (Texas)', load: 68.2, capacity: 82.0, utilization: 83.2, status: 'strained', lat: 31.97, lng: -99.90 },
  { id: 'pjm', name: 'PJM (Northeast US)', load: 120.5, capacity: 185.0, utilization: 65.1, status: 'normal', lat: 39.95, lng: -75.16 },
  { id: 'caiso', name: 'CAISO (California)', load: 38.9, capacity: 52.0, utilization: 74.8, status: 'normal', lat: 36.78, lng: -119.42 },
  { id: 'miso', name: 'MISO (Midwest US)', load: 95.0, capacity: 130.0, utilization: 73.1, status: 'normal', lat: 41.88, lng: -87.63 },
  { id: 'spp', name: 'SPP (Central US)', load: 42.3, capacity: 55.0, utilization: 76.9, status: 'normal', lat: 35.47, lng: -97.52 },
  { id: 'ukng', name: 'UK National Grid', load: 34.1, capacity: 45.0, utilization: 75.8, status: 'normal', lat: 52.48, lng: -1.90 },
  { id: 'detn', name: 'TenneT (Germany)', load: 52.8, capacity: 60.0, utilization: 88.0, status: 'strained', lat: 51.17, lng: 10.45 },
  { id: 'frte', name: 'RTE (France)', load: 61.0, capacity: 95.0, utilization: 64.2, status: 'normal', lat: 46.60, lng: 2.21 },
  { id: 'jpte', name: 'TEPCO (Japan)', load: 42.5, capacity: 55.0, utilization: 77.3, status: 'normal', lat: 35.68, lng: 139.69 },
  { id: 'inpg', name: 'POSOCO (India)', load: 185.0, capacity: 210.0, utilization: 88.1, status: 'strained', lat: 28.61, lng: 77.21 },
  { id: 'auem', name: 'AEMO (Australia)', load: 28.5, capacity: 42.0, utilization: 67.9, status: 'normal', lat: -33.87, lng: 151.21 },
  { id: 'zaes', name: 'Eskom (South Africa)', load: 30.5, capacity: 32.0, utilization: 95.3, status: 'critical', lat: -25.75, lng: 28.19 },
  { id: 'bron', name: 'ONS (Brazil)', load: 72.0, capacity: 105.0, utilization: 68.6, status: 'normal', lat: -15.79, lng: -47.88 },
  { id: 'cnsg', name: 'SGCC (China)', load: 580.0, capacity: 700.0, utilization: 82.9, status: 'strained', lat: 39.91, lng: 116.40 },
  { id: 'krep', name: 'KEPCO (South Korea)', load: 55.0, capacity: 75.0, utilization: 73.3, status: 'normal', lat: 37.57, lng: 126.98 },
  { id: 'ittn', name: 'Terna (Italy)', load: 38.0, capacity: 50.0, utilization: 76.0, status: 'normal', lat: 41.90, lng: 12.50 },
];

async function fetchGrids(): Promise<GridRegion[]> {
  await new Promise(r => setTimeout(r, 100));
  return MOCK;
}

const PowerGrid: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling(fetchGrids, 30000);
  const items = createMemo(() => data() ?? []);
  const { filtered, filter, setFilter } = useFilter(items, (g, f) => g.status === f);

  const critCount = createMemo(() => items().filter(g => g.status === 'critical').length);
  const strainCount = createMemo(() => items().filter(g => g.status === 'strained').length);
  const totalLoad = createMemo(() => items().reduce((s, g) => s + g.load, 0));

  const stats = createMemo(() => [
    { label: 'Regions', value: items().length },
    { label: 'Critical', value: critCount(), color: 'text-red-400' },
    { label: 'Strained', value: strainCount(), color: 'text-amber-400' },
    { label: 'Total Load', value: `${formatNumber(totalLoad(), { compact: true })}W` },
  ]);

  useMapLayer(props, () => {
    const d = filtered();
    if (!d.length) return null;
    return [createScatterLayer(`${props.instanceId}-grids`, d, {
      getPosition: (g: GridRegion) => [g.lng, g.lat],
      getFillColor: (g: GridRegion) => STATUS_COLOR[g.status] ?? [200, 200, 200, 180],
      getRadius: (g: GridRegion) => g.capacity * 200,
      radiusMinPixels: 6,
      radiusMaxPixels: 35,
    })];
  });

  return (
    <AppletShell title="Power Grid" status={critCount() > 0 ? 'error' : 'connected'}
      statusText={critCount() > 0 ? `${critCount()} critical` : 'Normal'}
      toolbar={<StatGrid stats={stats()} columns={4} />}
      headerRight={
        <select class="bg-surface-2 text-text-primary text-xs rounded px-2 py-1 border border-border"
          value={filter()} onChange={e => setFilter(e.currentTarget.value)}>
          <option value="">All</option>
          <option value="normal">Normal</option>
          <option value="strained">Strained</option>
          <option value="critical">Critical</option>
        </select>
      }>
      <DataList items={filtered} loading={loading} error={error}
        renderItem={(g: GridRegion) => (
          <div class="px-3 py-2 hover:bg-surface-2 transition-colors">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium truncate">{g.name}</span>
              <Badge text={g.status} variant={STATUS_BADGE[g.status]} />
            </div>
            <div class="flex gap-3 mt-1 text-xs text-text-secondary">
              <span>{g.load} / {g.capacity} GW</span>
              <span class={g.utilization > 85 ? 'text-amber-400' : ''}>{g.utilization.toFixed(1)}%</span>
            </div>
          </div>
        )} />
    </AppletShell>
  );
};

export default PowerGrid;
