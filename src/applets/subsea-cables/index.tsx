// ============================================================================
// SUBSEA CABLES — Submarine telecom cable monitor
// ============================================================================

import { Component, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, StatGrid, DataList, Badge,
  usePolling, useMapLayer, useFilter,
  createPathLayer,
} from '../../sdk';

export const manifest: AppletManifest = {
  id: 'subsea-cables',
  name: 'Subsea Cables',
  description: 'Submarine telecommunications cable network',
  category: 'infrastructure',
  icon: 'cable',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 120000,
  requiresMap: true,
};

interface LandingPoint { name: string; lat: number; lng: number; }
interface Cable {
  id: string; name: string; lengthKm: number; capacityTbps: number;
  landingPoints: LandingPoint[]; owners: string[]; status: 'active' | 'planned' | 'fault';
  year: number;
}

const STATUS_COLOR: Record<string, [number, number, number, number]> = {
  active:  [59, 130, 246, 180],
  planned: [156, 163, 175, 120],
  fault:   [239, 68, 68, 220],
};
const STATUS_BADGE: Record<string, 'success' | 'default' | 'danger'> = {
  active: 'success', planned: 'default', fault: 'danger',
};

const MOCK: Cable[] = [
  { id: 'c1', name: 'MAREA', lengthKm: 6600, capacityTbps: 200, owners: ['Microsoft', 'Meta'], status: 'active', year: 2017,
    landingPoints: [{ name: 'Virginia Beach', lat: 36.85, lng: -75.98 }, { name: 'Bilbao', lat: 43.26, lng: -2.93 }] },
  { id: 'c2', name: 'AEConnect-1', lengthKm: 5536, capacityTbps: 52, owners: ['Aqua Comms'], status: 'active', year: 2016,
    landingPoints: [{ name: 'Shirley, NY', lat: 40.80, lng: -72.87 }, { name: 'Killala', lat: 54.21, lng: -9.22 }] },
  { id: 'c3', name: 'SEA-ME-WE 6', lengthKm: 19200, capacityTbps: 126, owners: ['SingTel', 'Telia', 'Orange'], status: 'active', year: 2025,
    landingPoints: [{ name: 'Singapore', lat: 1.29, lng: 103.85 }, { name: 'Chennai', lat: 13.08, lng: 80.27 }, { name: 'Djibouti', lat: 11.59, lng: 43.15 }, { name: 'Marseille', lat: 43.30, lng: 5.37 }] },
  { id: 'c4', name: 'PEACE', lengthKm: 15000, capacityTbps: 96, owners: ['PEACE Cable'], status: 'active', year: 2022,
    landingPoints: [{ name: 'Karachi', lat: 24.85, lng: 66.99 }, { name: 'Djibouti', lat: 11.59, lng: 43.15 }, { name: 'Marseille', lat: 43.30, lng: 5.37 }] },
  { id: 'c5', name: 'Equiano', lengthKm: 12000, capacityTbps: 144, owners: ['Google'], status: 'active', year: 2023,
    landingPoints: [{ name: 'Lisbon', lat: 38.72, lng: -9.14 }, { name: 'Lagos', lat: 6.45, lng: 3.40 }, { name: 'Cape Town', lat: -33.92, lng: 18.42 }] },
  { id: 'c6', name: 'Grace Hopper', lengthKm: 6234, capacityTbps: 340, owners: ['Google'], status: 'active', year: 2022,
    landingPoints: [{ name: 'New York', lat: 40.57, lng: -73.97 }, { name: 'Bude', lat: 50.83, lng: -4.54 }, { name: 'Bilbao', lat: 43.26, lng: -2.93 }] },
  { id: 'c7', name: 'JUPITER', lengthKm: 14000, capacityTbps: 60, owners: ['Amazon', 'Meta', 'SoftBank'], status: 'active', year: 2020,
    landingPoints: [{ name: 'Virginia Beach', lat: 36.85, lng: -75.98 }, { name: 'Maruyama', lat: 33.52, lng: 135.78 }, { name: 'Shima', lat: 34.32, lng: 136.83 }] },
  { id: 'c8', name: 'AAE-1', lengthKm: 25000, capacityTbps: 40, owners: ['China Unicom', 'Reliance Jio'], status: 'fault', year: 2017,
    landingPoints: [{ name: 'Hong Kong', lat: 22.29, lng: 114.17 }, { name: 'Mumbai', lat: 19.08, lng: 72.88 }, { name: 'Aden', lat: 12.79, lng: 45.03 }, { name: 'Marseille', lat: 43.30, lng: 5.37 }] },
  { id: 'c9', name: '2Africa', lengthKm: 45000, capacityTbps: 180, owners: ['Meta', 'MTN', 'Orange', 'Vodafone'], status: 'active', year: 2024,
    landingPoints: [{ name: 'Barcelona', lat: 41.38, lng: 2.17 }, { name: 'Genoa', lat: 44.41, lng: 8.93 }, { name: 'Cape Town', lat: -33.92, lng: 18.42 }, { name: 'Mumbai', lat: 19.08, lng: 72.88 }] },
  { id: 'c10', name: 'Dunant', lengthKm: 6400, capacityTbps: 250, owners: ['Google'], status: 'active', year: 2020,
    landingPoints: [{ name: 'Virginia Beach', lat: 36.85, lng: -75.98 }, { name: 'Saint-Hilaire-de-Riez', lat: 46.73, lng: -1.79 }] },
  { id: 'c11', name: 'SJC2', lengthKm: 10500, capacityTbps: 144, owners: ['KDDI', 'China Telecom', 'Meta'], status: 'active', year: 2021,
    landingPoints: [{ name: 'Singapore', lat: 1.29, lng: 103.85 }, { name: 'Hong Kong', lat: 22.29, lng: 114.17 }, { name: 'Shima', lat: 34.32, lng: 136.83 }] },
  { id: 'c12', name: 'Bifrost', lengthKm: 14500, capacityTbps: 72, owners: ['Meta', 'Keppel'], status: 'planned', year: 2026,
    landingPoints: [{ name: 'Singapore', lat: 1.29, lng: 103.85 }, { name: 'Guam', lat: 13.44, lng: 144.79 }, { name: 'Portland', lat: 45.52, lng: -122.68 }] },
  { id: 'c13', name: 'EllaLink', lengthKm: 6000, capacityTbps: 72, owners: ['EllaLink'], status: 'active', year: 2021,
    landingPoints: [{ name: 'Sines', lat: 37.95, lng: -8.87 }, { name: 'Fortaleza', lat: -3.72, lng: -38.52 }] },
  { id: 'c14', name: 'Firmina', lengthKm: 14000, capacityTbps: 192, owners: ['Google'], status: 'active', year: 2023,
    landingPoints: [{ name: 'Myrtle Beach', lat: 33.69, lng: -78.89 }, { name: 'Praia Grande', lat: -24.01, lng: -46.40 }, { name: 'Las Toninas', lat: -36.48, lng: -56.69 }] },
  { id: 'c15', name: 'Apricot', lengthKm: 12000, capacityTbps: 190, owners: ['Meta', 'Google', 'NTT'], status: 'planned', year: 2026,
    landingPoints: [{ name: 'Singapore', lat: 1.29, lng: 103.85 }, { name: 'Shima', lat: 34.32, lng: 136.83 }, { name: 'Guam', lat: 13.44, lng: 144.79 }] },
];

async function fetchCables(): Promise<Cable[]> {
  await new Promise(r => setTimeout(r, 100));
  return MOCK;
}

const SubseaCables: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling(fetchCables, 120000);
  const items = createMemo(() => data() ?? []);
  const { filtered, filter, setFilter } = useFilter(items, (c, f) => c.status === f);

  const totalCapacity = createMemo(() => items().reduce((s, c) => s + c.capacityTbps, 0));
  const faultCount = createMemo(() => items().filter(c => c.status === 'fault').length);

  const stats = createMemo(() => [
    { label: 'Cables', value: items().length },
    { label: 'Total Tbps', value: totalCapacity() },
    { label: 'Faults', value: faultCount(), color: faultCount() > 0 ? 'text-red-400' : '' },
  ]);

  useMapLayer(props, () => {
    const d = filtered();
    if (!d.length) return null;
    return [createPathLayer(`${props.instanceId}-cables`, d, {
      getPath: (c: Cable) => c.landingPoints.map(lp => [lp.lng, lp.lat]),
      getColor: (c: Cable) => STATUS_COLOR[c.status] ?? [200, 200, 200, 180],
      widthMinPixels: 2,
    })];
  });

  return (
    <AppletShell title="Subsea Cables" status={faultCount() > 0 ? 'warning' : 'connected'}
      statusText={faultCount() > 0 ? `${faultCount()} fault` : 'All clear'}
      toolbar={<StatGrid stats={stats()} />}
      headerRight={
        <select class="bg-surface-2 text-text-primary text-xs rounded px-2 py-1 border border-border"
          value={filter()} onChange={e => setFilter(e.currentTarget.value)}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="planned">Planned</option>
          <option value="fault">Fault</option>
        </select>
      }>
      <DataList items={filtered} loading={loading} error={error}
        renderItem={(c: Cable) => (
          <div class="px-3 py-2 hover:bg-surface-2 transition-colors">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium truncate">{c.name}</span>
              <Badge text={c.status} variant={STATUS_BADGE[c.status]} />
            </div>
            <div class="flex gap-3 mt-1 text-xs text-text-secondary">
              <span>{c.lengthKm.toLocaleString()} km</span>
              <span>{c.capacityTbps} Tbps</span>
              <span>{c.year}</span>
            </div>
            <div class="mt-0.5 text-[10px] text-text-secondary truncate">
              {c.landingPoints.map(lp => lp.name).join(' - ')}
            </div>
          </div>
        )} />
    </AppletShell>
  );
};

export default SubseaCables;
