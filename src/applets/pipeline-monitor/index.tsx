// ============================================================================
// PIPELINE MONITOR — Oil and gas pipeline status
// ============================================================================

import { Component, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, StatGrid, DataList, Badge,
  usePolling, useMapLayer, useFilter,
  createPathLayer, formatNumber,
} from '../../sdk';

export const manifest: AppletManifest = {
  id: 'pipeline-monitor',
  name: 'Pipeline Monitor',
  description: 'Oil and gas pipeline status and throughput',
  category: 'infrastructure',
  icon: 'pipette',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 60000,
  requiresMap: true,
};

interface Pipeline {
  id: string; name: string; type: 'oil' | 'gas' | 'multi'; operator: string;
  capacityMbpd: number; throughputPct: number;
  status: 'operational' | 'maintenance' | 'incident';
  path: [number, number][];
}

const TYPE_COLOR: Record<string, [number, number, number, number]> = {
  oil:   [30, 30, 30, 220],
  gas:   [59, 130, 246, 200],
  multi: [168, 85, 247, 200],
};
const STATUS_BADGE: Record<string, 'success' | 'warning' | 'danger'> = {
  operational: 'success', maintenance: 'warning', incident: 'danger',
};
const TYPE_BADGE: Record<string, 'default' | 'info' | 'warning'> = {
  oil: 'default', gas: 'info', multi: 'warning',
};

const MOCK: Pipeline[] = [
  { id: 'pl1', name: 'Keystone XL', type: 'oil', operator: 'TC Energy', capacityMbpd: 0.83, throughputPct: 72, status: 'operational',
    path: [[-110.68, 50.95], [-108.50, 48.75], [-104.05, 46.81], [-100.35, 44.37], [-97.33, 40.81], [-95.99, 36.15], [-95.36, 29.76]] },
  { id: 'pl2', name: 'Druzhba', type: 'oil', operator: 'Transneft', capacityMbpd: 1.40, throughputPct: 55, status: 'operational',
    path: [[52.13, 54.74], [47.00, 53.20], [39.72, 52.60], [32.06, 52.43], [24.03, 51.50], [21.01, 52.23], [14.33, 51.34]] },
  { id: 'pl3', name: 'Nord Stream (route)', type: 'gas', operator: 'Nord Stream AG', capacityMbpd: 0, throughputPct: 0, status: 'incident',
    path: [[28.75, 59.45], [24.65, 59.50], [20.00, 58.50], [17.50, 56.50], [14.10, 55.10], [12.09, 54.18]] },
  { id: 'pl4', name: 'Trans-Alaska', type: 'oil', operator: 'Alyeska', capacityMbpd: 0.60, throughputPct: 42, status: 'operational',
    path: [[-148.68, 70.27], [-149.50, 68.50], [-149.10, 66.55], [-146.35, 64.84], [-145.75, 63.35], [-146.35, 61.13], [-146.40, 60.55]] },
  { id: 'pl5', name: 'TurkStream', type: 'gas', operator: 'Gazprom', capacityMbpd: 0, throughputPct: 78, status: 'operational',
    path: [[38.97, 44.68], [37.60, 44.05], [36.60, 43.30], [33.00, 42.50], [30.50, 41.80], [29.02, 41.02]] },
  { id: 'pl6', name: 'East-West Pipeline', type: 'oil', operator: 'Saudi Aramco', capacityMbpd: 5.00, throughputPct: 38, status: 'operational',
    path: [[49.98, 26.43], [47.50, 25.80], [45.00, 25.00], [42.50, 24.50], [39.17, 22.80], [38.69, 21.49]] },
  { id: 'pl7', name: 'Trans-Mediterranean (Transmed)', type: 'gas', operator: 'Sonatrach/Eni', capacityMbpd: 0, throughputPct: 65, status: 'operational',
    path: [[1.30, 33.00], [2.50, 34.50], [5.50, 36.00], [8.30, 37.00], [10.18, 36.80], [11.10, 37.30], [13.36, 38.12]] },
  { id: 'pl8', name: 'TAPI', type: 'gas', operator: 'Turkmengaz', capacityMbpd: 0, throughputPct: 0, status: 'maintenance',
    path: [[59.56, 37.95], [62.17, 36.71], [65.74, 31.62], [67.01, 30.20], [69.35, 27.70]] },
  { id: 'pl9', name: 'Dakota Access (DAPL)', type: 'oil', operator: 'Energy Transfer', capacityMbpd: 0.75, throughputPct: 88, status: 'operational',
    path: [[-103.62, 47.52], [-101.30, 46.88], [-99.50, 45.50], [-97.50, 44.30], [-96.70, 43.55], [-95.86, 42.50], [-91.19, 40.82]] },
  { id: 'pl10', name: 'Southern Gas Corridor (TANAP)', type: 'gas', operator: 'SOCAR', capacityMbpd: 0, throughputPct: 70, status: 'operational',
    path: [[49.87, 40.41], [46.30, 39.90], [43.80, 40.18], [39.92, 39.65], [36.40, 39.60], [32.87, 39.92], [29.02, 41.02]] },
  { id: 'pl11', name: 'Trans Mountain', type: 'oil', operator: 'Trans Mountain Corp', capacityMbpd: 0.89, throughputPct: 92, status: 'operational',
    path: [[-114.07, 53.54], [-116.58, 53.10], [-118.80, 52.90], [-119.77, 50.26], [-122.89, 49.28]] },
  { id: 'pl12', name: 'Yamal-Europe', type: 'gas', operator: 'Gazprom', capacityMbpd: 0, throughputPct: 15, status: 'maintenance',
    path: [[73.37, 68.50], [66.53, 66.53], [56.25, 58.01], [40.00, 55.75], [32.00, 52.43], [24.00, 51.50], [21.00, 52.23], [16.90, 52.41]] },
];

async function fetchPipelines(): Promise<Pipeline[]> {
  await new Promise(r => setTimeout(r, 110));
  return MOCK;
}

const PipelineMonitor: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling(fetchPipelines, 60000);
  const items = createMemo(() => data() ?? []);
  const { filtered, filter, setFilter } = useFilter(items, (p, f) => p.status === f);

  const incidents = createMemo(() => items().filter(p => p.status === 'incident').length);
  const maintenance = createMemo(() => items().filter(p => p.status === 'maintenance').length);
  const oilCount = createMemo(() => items().filter(p => p.type === 'oil').length);
  const gasCount = createMemo(() => items().filter(p => p.type === 'gas').length);

  const stats = createMemo(() => [
    { label: 'Pipelines', value: items().length },
    { label: 'Oil', value: oilCount() },
    { label: 'Gas', value: gasCount() },
    { label: 'Incidents', value: incidents(), color: incidents() > 0 ? 'text-red-400' : '' },
  ]);

  useMapLayer(props, () => {
    const d = filtered();
    if (!d.length) return null;
    return [createPathLayer(`${props.instanceId}-pipes`, d, {
      getPath: (p: Pipeline) => p.path.map(([lng, lat]) => [lng, lat]),
      getColor: (p: Pipeline) => {
        if (p.status === 'incident') return [239, 68, 68, 220] as [number, number, number, number];
        if (p.status === 'maintenance') return [249, 115, 22, 180] as [number, number, number, number];
        return TYPE_COLOR[p.type] ?? [200, 200, 200, 180];
      },
      widthMinPixels: 2,
    })];
  });

  return (
    <AppletShell title="Pipeline Monitor" status={incidents() > 0 ? 'error' : 'connected'}
      statusText={incidents() > 0 ? `${incidents()} incident` : 'Operational'}
      toolbar={<StatGrid stats={stats()} columns={4} />}
      headerRight={
        <select class="bg-surface-2 text-text-primary text-xs rounded px-2 py-1 border border-border"
          value={filter()} onChange={e => setFilter(e.currentTarget.value)}>
          <option value="">All</option>
          <option value="operational">Operational</option>
          <option value="maintenance">Maintenance</option>
          <option value="incident">Incident</option>
        </select>
      }>
      <DataList items={filtered} loading={loading} error={error}
        renderItem={(p: Pipeline) => (
          <div class="px-3 py-2 hover:bg-surface-2 transition-colors">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium truncate">{p.name}</span>
              <div class="flex gap-1 shrink-0">
                <Badge text={p.type} variant={TYPE_BADGE[p.type]} />
                <Badge text={p.status} variant={STATUS_BADGE[p.status]} />
              </div>
            </div>
            <div class="flex gap-3 mt-1 text-xs text-text-secondary">
              <span>{p.operator}</span>
              <span>{p.throughputPct}% throughput</span>
              {p.type === 'oil' && <span>{p.capacityMbpd} Mbpd cap</span>}
            </div>
          </div>
        )} />
    </AppletShell>
  );
};

export default PipelineMonitor;
