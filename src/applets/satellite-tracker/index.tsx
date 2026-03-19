// ============================================================================
// SATELLITE TRACKER — Orbital satellite position monitor
// ============================================================================

import { Component, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, StatGrid, DataList, Badge,
  usePolling, useMapLayer, useFilter,
  createScatterLayer, formatNumber,
} from '../../sdk';

export const manifest: AppletManifest = {
  id: 'satellite-tracker',
  name: 'Satellite Tracker',
  description: 'Active satellite positions and orbital data',
  category: 'infrastructure',
  icon: 'satellite',
  defaultSize: { w: 3, h: 4 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 15000,
  requiresMap: true,
};

interface Satellite {
  id: string; name: string; noradId: number; type: string;
  lat: number; lng: number; altitude: number; velocity: number; country: string;
}

const TYPE_COLOR: Record<string, [number, number, number, number]> = {
  communication:      [59, 130, 246, 200],
  weather:            [34, 197, 94, 200],
  navigation:         [250, 204, 21, 200],
  'earth observation': [168, 85, 247, 200],
  military:           [239, 68, 68, 200],
  station:            [255, 255, 255, 240],
};

const TYPE_BADGE: Record<string, 'info' | 'success' | 'warning' | 'default' | 'danger'> = {
  communication: 'info', weather: 'success', navigation: 'warning',
  'earth observation': 'info', military: 'danger', station: 'default',
};

const MOCK: Satellite[] = [
  { id: 's1', name: 'ISS (ZARYA)', noradId: 25544, type: 'station', lat: 28.15, lng: -42.30, altitude: 420, velocity: 7.66, country: 'INT' },
  { id: 's2', name: 'TIANGONG', noradId: 48274, type: 'station', lat: -12.50, lng: 105.80, altitude: 385, velocity: 7.68, country: 'CN' },
  { id: 's3', name: 'STARLINK-5401', noradId: 56790, type: 'communication', lat: 45.20, lng: -73.50, altitude: 550, velocity: 7.59, country: 'US' },
  { id: 's4', name: 'STARLINK-5822', noradId: 57012, type: 'communication', lat: -22.80, lng: 31.40, altitude: 550, velocity: 7.59, country: 'US' },
  { id: 's5', name: 'OneWeb-0412', noradId: 53001, type: 'communication', lat: 55.30, lng: 12.70, altitude: 1200, velocity: 7.32, country: 'GB' },
  { id: 's6', name: 'GOES-18', noradId: 51850, type: 'weather', lat: 0.02, lng: -137.20, altitude: 35786, velocity: 3.07, country: 'US' },
  { id: 's7', name: 'Meteosat-12', noradId: 55438, type: 'weather', lat: 0.05, lng: 0.10, altitude: 35786, velocity: 3.07, country: 'EU' },
  { id: 's8', name: 'Himawari-9', noradId: 41836, type: 'weather', lat: 0.01, lng: 140.70, altitude: 35786, velocity: 3.07, country: 'JP' },
  { id: 's9', name: 'GPS IIF-12', noradId: 41019, type: 'navigation', lat: 38.50, lng: -95.20, altitude: 20200, velocity: 3.87, country: 'US' },
  { id: 's10', name: 'GALILEO-26', noradId: 49810, type: 'navigation', lat: 22.30, lng: 45.60, altitude: 23222, velocity: 3.60, country: 'EU' },
  { id: 's11', name: 'GLONASS-K2 18', noradId: 55102, type: 'navigation', lat: 64.80, lng: 68.50, altitude: 19100, velocity: 3.95, country: 'RU' },
  { id: 's12', name: 'BeiDou-3 M25', noradId: 54120, type: 'navigation', lat: 12.40, lng: 118.30, altitude: 21528, velocity: 3.63, country: 'CN' },
  { id: 's13', name: 'Sentinel-2B', noradId: 42063, type: 'earth observation', lat: -35.10, lng: -60.20, altitude: 786, velocity: 7.45, country: 'EU' },
  { id: 's14', name: 'Landsat 9', noradId: 49260, type: 'earth observation', lat: 42.60, lng: -112.80, altitude: 705, velocity: 7.50, country: 'US' },
  { id: 's15', name: 'RADARSAT Constellation 1', noradId: 44322, type: 'earth observation', lat: 58.20, lng: -98.50, altitude: 600, velocity: 7.56, country: 'CA' },
  { id: 's16', name: 'USA-326 (KH-11)', noradId: 54891, type: 'military', lat: 34.00, lng: 52.50, altitude: 260, velocity: 7.75, country: 'US' },
  { id: 's17', name: 'Kosmos-2569', noradId: 56230, type: 'military', lat: 62.40, lng: 38.10, altitude: 320, velocity: 7.70, country: 'RU' },
  { id: 's18', name: 'Intelsat 40e', noradId: 55670, type: 'communication', lat: 0.03, lng: -58.00, altitude: 35786, velocity: 3.07, country: 'US' },
  { id: 's19', name: 'SES-17', noradId: 49055, type: 'communication', lat: 0.01, lng: -67.10, altitude: 35786, velocity: 3.07, country: 'LU' },
  { id: 's20', name: 'ALOS-4', noradId: 56780, type: 'earth observation', lat: -8.30, lng: 142.50, altitude: 628, velocity: 7.54, country: 'JP' },
  { id: 's21', name: 'Yaogan-39A', noradId: 57890, type: 'military', lat: 18.20, lng: 110.50, altitude: 500, velocity: 7.61, country: 'CN' },
];

async function fetchSatellites(): Promise<Satellite[]> {
  await new Promise(r => setTimeout(r, 80));
  return MOCK;
}

const SatelliteTracker: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling(fetchSatellites, 15000);
  const items = createMemo(() => data() ?? []);
  const { filtered, filter, setFilter } = useFilter(items, (s, f) => s.type === f);

  const types = createMemo(() => {
    const c: Record<string, number> = {};
    items().forEach(s => { c[s.type] = (c[s.type] || 0) + 1; });
    return c;
  });

  const stats = createMemo(() => [
    { label: 'Total', value: items().length },
    { label: 'Comms', value: types()['communication'] ?? 0 },
    { label: 'Nav', value: types()['navigation'] ?? 0 },
    { label: 'EO', value: types()['earth observation'] ?? 0 },
  ]);

  useMapLayer(props, () => {
    const d = filtered();
    if (!d.length) return null;
    return [createScatterLayer(`${props.instanceId}-sats`, d, {
      getPosition: (s: Satellite) => [s.lng, s.lat],
      getFillColor: (s: Satellite) => TYPE_COLOR[s.type] ?? [200, 200, 200, 180],
      radiusMinPixels: 4,
      radiusMaxPixels: 10,
    })];
  });

  const typeOptions = () => ['All', 'communication', 'weather', 'navigation', 'earth observation', 'military', 'station'];

  return (
    <AppletShell title="Satellite Tracker" status={loading() ? 'loading' : 'connected'}
      statusText={`${items().length} tracked`}
      toolbar={<StatGrid stats={stats()} columns={4} />}
      headerRight={
        <select class="bg-surface-2 text-text-primary text-xs rounded px-2 py-1 border border-border"
          value={filter()} onChange={e => setFilter(e.currentTarget.value)}>
          {typeOptions().map(o => <option value={o === 'All' ? '' : o}>{o}</option>)}
        </select>
      }>
      <DataList items={filtered} loading={loading} error={error}
        renderItem={(s: Satellite) => (
          <div class="px-3 py-2 hover:bg-surface-2 transition-colors">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium truncate">{s.name}</span>
              <Badge text={s.type} variant={TYPE_BADGE[s.type] ?? 'default'} />
            </div>
            <div class="flex gap-3 mt-1 text-xs text-text-secondary">
              <span>NORAD {s.noradId}</span>
              <span>{formatNumber(s.altitude, { compact: true })} km</span>
              <span>{s.velocity.toFixed(2)} km/s</span>
              <span>{s.country}</span>
            </div>
          </div>
        )} />
    </AppletShell>
  );
};

export default SatelliteTracker;
