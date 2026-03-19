// ============================================================================
// INTERNET OUTAGES — Global connectivity disruption monitor
// ============================================================================

import { Component, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, StatGrid, DataList, Badge,
  usePolling, useMapLayer, useFilter,
  createScatterLayer, formatNumber,
} from '../../sdk';

export const manifest: AppletManifest = {
  id: 'internet-outages',
  name: 'Internet Outages',
  description: 'Global internet connectivity disruptions',
  category: 'infrastructure',
  icon: 'wifi-off',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 60000,
  requiresMap: true,
};

interface Outage {
  id: string; country: string; region: string; severity: 'major' | 'moderate' | 'minor';
  isps: string[]; startTime: number; durationMin: number; usersAffected: number;
  lat: number; lng: number;
}

const SEV_COLOR: Record<string, [number, number, number, number]> = {
  major:    [239, 68, 68, 220],
  moderate: [249, 115, 22, 200],
  minor:    [250, 204, 21, 180],
};

const SEV_BADGE: Record<string, 'danger' | 'warning' | 'info'> = {
  major: 'danger', moderate: 'warning', minor: 'info',
};

const MOCK: Outage[] = [
  { id: 'o1', country: 'Iran', region: 'Nationwide', severity: 'major', isps: ['TCI', 'MCI', 'Irancell'], startTime: Date.now() - 7200000, durationMin: 120, usersAffected: 45000000, lat: 32.43, lng: 53.69 },
  { id: 'o2', country: 'Sudan', region: 'Khartoum', severity: 'major', isps: ['Sudatel', 'Zain'], startTime: Date.now() - 14400000, durationMin: 240, usersAffected: 12000000, lat: 15.50, lng: 32.56 },
  { id: 'o3', country: 'India', region: 'Manipur', severity: 'moderate', isps: ['BSNL', 'Jio'], startTime: Date.now() - 3600000, durationMin: 60, usersAffected: 3200000, lat: 24.82, lng: 93.95 },
  { id: 'o4', country: 'Pakistan', region: 'Balochistan', severity: 'moderate', isps: ['PTCL', 'Jazz'], startTime: Date.now() - 5400000, durationMin: 90, usersAffected: 4500000, lat: 28.49, lng: 65.10 },
  { id: 'o5', country: 'Ethiopia', region: 'Tigray', severity: 'major', isps: ['Ethio Telecom'], startTime: Date.now() - 86400000, durationMin: 1440, usersAffected: 7000000, lat: 13.50, lng: 39.47 },
  { id: 'o6', country: 'Cuba', region: 'Havana', severity: 'moderate', isps: ['ETECSA'], startTime: Date.now() - 10800000, durationMin: 180, usersAffected: 2100000, lat: 23.11, lng: -82.37 },
  { id: 'o7', country: 'Myanmar', region: 'Yangon', severity: 'major', isps: ['MPT', 'Telenor Myanmar'], startTime: Date.now() - 43200000, durationMin: 720, usersAffected: 18000000, lat: 16.87, lng: 96.20 },
  { id: 'o8', country: 'Brazil', region: 'Amapa', severity: 'minor', isps: ['Vivo', 'Claro'], startTime: Date.now() - 1800000, durationMin: 30, usersAffected: 450000, lat: 1.02, lng: -52.00 },
  { id: 'o9', country: 'Turkey', region: 'Southeast', severity: 'moderate', isps: ['Turk Telekom', 'Turkcell'], startTime: Date.now() - 7200000, durationMin: 120, usersAffected: 5600000, lat: 37.22, lng: 40.73 },
  { id: 'o10', country: 'Russia', region: 'Dagestan', severity: 'minor', isps: ['Rostelecom'], startTime: Date.now() - 2700000, durationMin: 45, usersAffected: 800000, lat: 42.98, lng: 47.50 },
  { id: 'o11', country: 'Venezuela', region: 'Caracas', severity: 'moderate', isps: ['CANTV', 'Movistar'], startTime: Date.now() - 9000000, durationMin: 150, usersAffected: 6300000, lat: 10.48, lng: -66.90 },
  { id: 'o12', country: 'Bangladesh', region: 'Chittagong', severity: 'minor', isps: ['Grameenphone', 'Robi'], startTime: Date.now() - 1200000, durationMin: 20, usersAffected: 1100000, lat: 22.36, lng: 91.78 },
  { id: 'o13', country: 'Nigeria', region: 'Lagos', severity: 'minor', isps: ['MTN', 'Glo'], startTime: Date.now() - 600000, durationMin: 10, usersAffected: 900000, lat: 6.52, lng: 3.38 },
];

async function fetchOutages(): Promise<Outage[]> {
  await new Promise(r => setTimeout(r, 120));
  return MOCK;
}

const InternetOutages: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling(fetchOutages, 60000);
  const items = createMemo(() => data() ?? []);
  const { filtered, filter, setFilter } = useFilter(items, (o, f) => o.severity === f);

  const totalUsers = createMemo(() => items().reduce((s, o) => s + o.usersAffected, 0));
  const countries = createMemo(() => new Set(items().map(o => o.country)).size);

  const stats = createMemo(() => [
    { label: 'Active', value: items().length, color: 'text-red-400' },
    { label: 'Users Affected', value: formatNumber(totalUsers(), { compact: true }) },
    { label: 'Countries', value: countries() },
  ]);

  useMapLayer(props, () => {
    const d = filtered();
    if (!d.length) return null;
    return [createScatterLayer(`${props.instanceId}-outages`, d, {
      getPosition: (o: Outage) => [o.lng, o.lat],
      getFillColor: (o: Outage) => SEV_COLOR[o.severity] ?? [200, 200, 200, 180],
      getRadius: (o: Outage) => Math.sqrt(o.usersAffected) * 10,
      radiusMinPixels: 5,
      radiusMaxPixels: 40,
    })];
  });

  return (
    <AppletShell title="Internet Outages" status={loading() ? 'loading' : 'warning'}
      statusText={`${items().length} active`}
      toolbar={<StatGrid stats={stats()} />}
      headerRight={
        <select class="bg-surface-2 text-text-primary text-xs rounded px-2 py-1 border border-border"
          value={filter()} onChange={e => setFilter(e.currentTarget.value)}>
          <option value="">All</option>
          <option value="major">Major</option>
          <option value="moderate">Moderate</option>
          <option value="minor">Minor</option>
        </select>
      }>
      <DataList items={filtered} loading={loading} error={error}
        renderItem={(o: Outage) => (
          <div class="px-3 py-2 hover:bg-surface-2 transition-colors">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">{o.country} — {o.region}</span>
              <Badge text={o.severity} variant={SEV_BADGE[o.severity]} />
            </div>
            <div class="flex gap-3 mt-1 text-xs text-text-secondary">
              <span>{formatNumber(o.usersAffected, { compact: true })} users</span>
              <span>{o.durationMin}m</span>
              <span class="truncate">{o.isps.join(', ')}</span>
            </div>
          </div>
        )} />
    </AppletShell>
  );
};

export default InternetOutages;
