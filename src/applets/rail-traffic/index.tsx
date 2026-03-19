// ============================================================================
// RAIL TRAFFIC — Major rail corridor status monitor
// ============================================================================

import { Component, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, StatGrid, DataList, Badge,
  usePolling, useMapLayer, useFilter,
  createPathLayer,
} from '../../sdk';

export const manifest: AppletManifest = {
  id: 'rail-traffic',
  name: 'Rail Traffic',
  description: 'Major rail corridor status and disruptions',
  category: 'infrastructure',
  icon: 'train-front',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 60000,
  requiresMap: true,
};

interface RailCorridor {
  id: string; name: string; region: string; type: 'freight' | 'passenger' | 'high-speed';
  status: 'normal' | 'delayed' | 'disrupted'; operator: string;
  path: [number, number][];
}

const STATUS_COLOR: Record<string, [number, number, number, number]> = {
  normal:    [34, 197, 94, 180],
  delayed:   [249, 115, 22, 200],
  disrupted: [239, 68, 68, 220],
};
const STATUS_BADGE: Record<string, 'success' | 'warning' | 'danger'> = {
  normal: 'success', delayed: 'warning', disrupted: 'danger',
};
const TYPE_BADGE: Record<string, 'info' | 'default' | 'warning'> = {
  freight: 'default', passenger: 'info', 'high-speed': 'warning',
};

const MOCK: RailCorridor[] = [
  { id: 'r1', name: 'Northeast Corridor', region: 'US East', type: 'passenger', status: 'normal', operator: 'Amtrak',
    path: [[-77.03, 38.90], [-75.17, 39.95], [-74.01, 40.71], [-73.20, 41.18], [-72.92, 41.31], [-71.06, 42.36]] },
  { id: 'r2', name: 'BNSF Transcon', region: 'US', type: 'freight', status: 'delayed', operator: 'BNSF',
    path: [[-118.24, 34.05], [-115.14, 36.17], [-111.89, 33.45], [-106.65, 35.08], [-97.52, 35.47], [-94.63, 38.97], [-87.63, 41.88]] },
  { id: 'r3', name: 'Eurostar', region: 'UK-France', type: 'high-speed', status: 'normal', operator: 'Eurostar',
    path: [[-0.11, 51.53], [1.09, 51.28], [1.86, 50.95], [2.36, 48.88]] },
  { id: 'r4', name: 'Tokaido Shinkansen', region: 'Japan', type: 'high-speed', status: 'normal', operator: 'JR Central',
    path: [[139.77, 35.68], [139.10, 35.18], [138.38, 34.97], [137.39, 34.77], [136.90, 35.17], [135.76, 35.01], [135.50, 34.69]] },
  { id: 'r5', name: 'Trans-Siberian', region: 'Russia', type: 'passenger', status: 'normal', operator: 'RZD',
    path: [[37.62, 55.76], [49.11, 55.80], [56.32, 54.74], [60.60, 56.84], [73.37, 54.99], [82.93, 55.03], [104.30, 52.27], [131.89, 43.12]] },
  { id: 'r6', name: 'Beijing-Shanghai HSR', region: 'China', type: 'high-speed', status: 'normal', operator: 'CR',
    path: [[116.40, 39.91], [117.20, 39.09], [117.00, 36.65], [116.98, 34.75], [117.28, 34.21], [118.80, 32.06], [120.38, 31.23], [121.47, 31.23]] },
  { id: 'r7', name: 'Indian Pacific', region: 'Australia', type: 'passenger', status: 'delayed', operator: 'Journey Beyond',
    path: [[151.21, -33.87], [149.13, -35.28], [138.60, -34.93], [121.89, -33.86], [115.86, -31.95]] },
  { id: 'r8', name: 'Rhine-Alpine Corridor', region: 'Europe', type: 'freight', status: 'disrupted', operator: 'DB Cargo',
    path: [[4.40, 51.23], [4.35, 50.85], [6.08, 50.77], [6.96, 50.94], [8.68, 50.11], [9.18, 48.78], [7.59, 47.56], [8.54, 47.38], [9.19, 45.46]] },
  { id: 'r9', name: 'TGV Sud-Est', region: 'France', type: 'high-speed', status: 'normal', operator: 'SNCF',
    path: [[2.36, 48.88], [3.08, 46.81], [4.83, 45.76], [5.37, 43.30]] },
  { id: 'r10', name: 'UP Sunset Route', region: 'US South', type: 'freight', status: 'normal', operator: 'Union Pacific',
    path: [[-118.24, 34.05], [-115.49, 32.72], [-110.93, 32.22], [-106.44, 31.76], [-97.75, 30.27], [-95.36, 29.76], [-90.07, 29.95]] },
  { id: 'r11', name: 'Tren Maya', region: 'Mexico', type: 'passenger', status: 'delayed', operator: 'FONATUR',
    path: [[-90.53, 19.84], [-89.62, 20.97], [-87.46, 20.21], [-87.07, 20.63], [-88.30, 18.50], [-90.53, 19.84]] },
  { id: 'r12', name: 'Gautrain', region: 'South Africa', type: 'passenger', status: 'normal', operator: 'Bombela',
    path: [[28.05, -26.20], [28.19, -26.11], [28.23, -25.76]] },
];

async function fetchRail(): Promise<RailCorridor[]> {
  await new Promise(r => setTimeout(r, 100));
  return MOCK;
}

const RailTraffic: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling(fetchRail, 60000);
  const items = createMemo(() => data() ?? []);
  const { filtered, filter, setFilter } = useFilter(items, (r, f) => r.status === f);

  const disrupted = createMemo(() => items().filter(r => r.status === 'disrupted').length);
  const delayed = createMemo(() => items().filter(r => r.status === 'delayed').length);

  const stats = createMemo(() => [
    { label: 'Corridors', value: items().length },
    { label: 'Normal', value: items().filter(r => r.status === 'normal').length, color: 'text-emerald-400' },
    { label: 'Delayed', value: delayed(), color: 'text-amber-400' },
    { label: 'Disrupted', value: disrupted(), color: 'text-red-400' },
  ]);

  useMapLayer(props, () => {
    const d = filtered();
    if (!d.length) return null;
    return [createPathLayer(`${props.instanceId}-rail`, d, {
      getPath: (r: RailCorridor) => r.path.map(([lng, lat]) => [lng, lat]),
      getColor: (r: RailCorridor) => STATUS_COLOR[r.status] ?? [200, 200, 200, 180],
      widthMinPixels: 2,
    })];
  });

  return (
    <AppletShell title="Rail Traffic" status={disrupted() > 0 ? 'error' : 'connected'}
      statusText={disrupted() > 0 ? `${disrupted()} disrupted` : 'Normal'}
      toolbar={<StatGrid stats={stats()} columns={4} />}
      headerRight={
        <select class="bg-surface-2 text-text-primary text-xs rounded px-2 py-1 border border-border"
          value={filter()} onChange={e => setFilter(e.currentTarget.value)}>
          <option value="">All</option>
          <option value="normal">Normal</option>
          <option value="delayed">Delayed</option>
          <option value="disrupted">Disrupted</option>
        </select>
      }>
      <DataList items={filtered} loading={loading} error={error}
        renderItem={(r: RailCorridor) => (
          <div class="px-3 py-2 hover:bg-surface-2 transition-colors">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium truncate">{r.name}</span>
              <div class="flex gap-1 shrink-0">
                <Badge text={r.type} variant={TYPE_BADGE[r.type]} />
                <Badge text={r.status} variant={STATUS_BADGE[r.status]} />
              </div>
            </div>
            <div class="flex gap-3 mt-1 text-xs text-text-secondary">
              <span>{r.region}</span>
              <span>{r.operator}</span>
            </div>
          </div>
        )} />
    </AppletShell>
  );
};

export default RailTraffic;
