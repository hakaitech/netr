// ============================================================================
// PORT CONGESTION — Container port wait times and throughput
// ============================================================================

import { Component, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, StatGrid, DataList, Badge,
  usePolling, useMapLayer, useFilter,
  createScatterLayer, formatNumber,
} from '../../sdk';

export const manifest: AppletManifest = {
  id: 'port-congestion',
  name: 'Port Congestion',
  description: 'Container port wait times and congestion levels',
  category: 'infrastructure',
  icon: 'anchor',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 60000,
  requiresMap: true,
};

interface Port {
  id: string; name: string; country: string; lat: number; lng: number;
  vesselsWaiting: number; avgWaitDays: number; throughput: number;
  status: 'clear' | 'busy' | 'congested';
}

const STATUS_COLOR: Record<string, [number, number, number, number]> = {
  clear:     [34, 197, 94, 200],
  busy:      [249, 115, 22, 200],
  congested: [239, 68, 68, 220],
};

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'danger'> = {
  clear: 'success', busy: 'warning', congested: 'danger',
};

const MOCK: Port[] = [
  { id: 'p1', name: 'Shanghai', country: 'CN', lat: 31.23, lng: 121.47, vesselsWaiting: 42, avgWaitDays: 3.2, throughput: 14200, status: 'congested' },
  { id: 'p2', name: 'Singapore', country: 'SG', lat: 1.26, lng: 103.84, vesselsWaiting: 28, avgWaitDays: 1.8, throughput: 11800, status: 'busy' },
  { id: 'p3', name: 'Rotterdam', country: 'NL', lat: 51.91, lng: 4.49, vesselsWaiting: 12, avgWaitDays: 0.8, throughput: 4200, status: 'clear' },
  { id: 'p4', name: 'Los Angeles', country: 'US', lat: 33.74, lng: -118.27, vesselsWaiting: 35, avgWaitDays: 4.1, throughput: 3100, status: 'congested' },
  { id: 'p5', name: 'Long Beach', country: 'US', lat: 33.75, lng: -118.19, vesselsWaiting: 30, avgWaitDays: 3.8, throughput: 2800, status: 'congested' },
  { id: 'p6', name: 'Busan', country: 'KR', lat: 35.10, lng: 129.07, vesselsWaiting: 18, avgWaitDays: 1.5, throughput: 6200, status: 'busy' },
  { id: 'p7', name: 'Hamburg', country: 'DE', lat: 53.55, lng: 9.97, vesselsWaiting: 8, avgWaitDays: 0.5, throughput: 2400, status: 'clear' },
  { id: 'p8', name: 'Shenzhen', country: 'CN', lat: 22.53, lng: 114.06, vesselsWaiting: 38, avgWaitDays: 2.9, throughput: 8100, status: 'congested' },
  { id: 'p9', name: 'Ningbo-Zhoushan', country: 'CN', lat: 29.87, lng: 121.55, vesselsWaiting: 32, avgWaitDays: 2.5, throughput: 9500, status: 'busy' },
  { id: 'p10', name: 'Dubai (Jebel Ali)', country: 'AE', lat: 25.01, lng: 55.06, vesselsWaiting: 15, avgWaitDays: 1.2, throughput: 4700, status: 'busy' },
  { id: 'p11', name: 'Antwerp', country: 'BE', lat: 51.23, lng: 4.40, vesselsWaiting: 10, avgWaitDays: 0.7, throughput: 3800, status: 'clear' },
  { id: 'p12', name: 'Tanjung Pelepas', country: 'MY', lat: 1.37, lng: 103.55, vesselsWaiting: 14, avgWaitDays: 1.0, throughput: 3200, status: 'clear' },
  { id: 'p13', name: 'Felixstowe', country: 'GB', lat: 51.96, lng: 1.35, vesselsWaiting: 9, avgWaitDays: 0.6, throughput: 1200, status: 'clear' },
  { id: 'p14', name: 'Savannah', country: 'US', lat: 32.08, lng: -81.09, vesselsWaiting: 20, avgWaitDays: 2.2, throughput: 1600, status: 'busy' },
  { id: 'p15', name: 'Piraeus', country: 'GR', lat: 37.94, lng: 23.64, vesselsWaiting: 11, avgWaitDays: 0.9, throughput: 1800, status: 'clear' },
  { id: 'p16', name: 'Santos', country: 'BR', lat: -23.96, lng: -46.31, vesselsWaiting: 22, avgWaitDays: 2.5, throughput: 1100, status: 'busy' },
];

async function fetchPorts(): Promise<Port[]> {
  await new Promise(r => setTimeout(r, 120));
  return MOCK;
}

const PortCongestion: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling(fetchPorts, 60000);
  const items = createMemo(() => data() ?? []);
  const { filtered, filter, setFilter } = useFilter(items, (p, f) => p.status === f);

  const congested = createMemo(() => items().filter(p => p.status === 'congested').length);
  const totalWaiting = createMemo(() => items().reduce((s, p) => s + p.vesselsWaiting, 0));
  const avgWait = createMemo(() => {
    const arr = items();
    return arr.length ? (arr.reduce((s, p) => s + p.avgWaitDays, 0) / arr.length).toFixed(1) : '0';
  });

  const stats = createMemo(() => [
    { label: 'Ports', value: items().length },
    { label: 'Vessels Waiting', value: totalWaiting() },
    { label: 'Congested', value: congested(), color: 'text-red-400' },
    { label: 'Avg Wait', value: `${avgWait()}d` },
  ]);

  useMapLayer(props, () => {
    const d = filtered();
    if (!d.length) return null;
    return [createScatterLayer(`${props.instanceId}-ports`, d, {
      getPosition: (p: Port) => [p.lng, p.lat],
      getFillColor: (p: Port) => STATUS_COLOR[p.status] ?? [200, 200, 200, 180],
      getRadius: (p: Port) => p.vesselsWaiting * 300,
      radiusMinPixels: 5,
      radiusMaxPixels: 35,
    })];
  });

  return (
    <AppletShell title="Port Congestion" status={congested() > 0 ? 'warning' : 'connected'}
      statusText={congested() > 0 ? `${congested()} congested` : 'All clear'}
      toolbar={<StatGrid stats={stats()} columns={4} />}
      headerRight={
        <select class="bg-surface-2 text-text-primary text-xs rounded px-2 py-1 border border-border"
          value={filter()} onChange={e => setFilter(e.currentTarget.value)}>
          <option value="">All</option>
          <option value="clear">Clear</option>
          <option value="busy">Busy</option>
          <option value="congested">Congested</option>
        </select>
      }>
      <DataList items={filtered} loading={loading} error={error}
        renderItem={(p: Port) => (
          <div class="px-3 py-2 hover:bg-surface-2 transition-colors">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium truncate">{p.name}</span>
              <Badge text={p.status} variant={STATUS_BADGE[p.status]} />
            </div>
            <div class="flex gap-3 mt-1 text-xs text-text-secondary">
              <span>{p.vesselsWaiting} waiting</span>
              <span>{p.avgWaitDays}d avg</span>
              <span>{formatNumber(p.throughput, { compact: true })} TEU/d</span>
              <span>{p.country}</span>
            </div>
          </div>
        )} />
    </AppletShell>
  );
};

export default PortCongestion;
