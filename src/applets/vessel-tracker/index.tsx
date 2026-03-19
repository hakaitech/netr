// ============================================================================
// VESSEL TRACKER — Maritime vessel positions with type classification
// ============================================================================

import { Component, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, StatGrid, DataList, Badge, FilterBar,
  usePolling, useMapLayer, useFilter,
  createScatterLayer, formatNumber,
} from '../../sdk';

export const manifest: AppletManifest = {
  id: 'vessel-tracker',
  name: 'Vessel Tracker',
  description: 'Maritime vessel positions and type classification',
  category: 'infrastructure',
  icon: 'ship',
  defaultSize: { w: 3, h: 4 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 30000,
  requiresMap: true,
};

interface Vessel {
  mmsi: string; name: string; type: string; lat: number; lng: number;
  speed: number; heading: number; destination: string; flag: string;
}

const TYPE_COLORS: Record<string, [number, number, number, number]> = {
  cargo:     [59, 130, 246, 200],
  tanker:    [249, 115, 22, 200],
  container: [34, 197, 94, 200],
  fishing:   [156, 163, 175, 180],
  passenger: [168, 85, 247, 200],
  military:  [239, 68, 68, 200],
};

const BADGE_VARIANT: Record<string, 'info' | 'warning' | 'success' | 'default' | 'danger'> = {
  cargo: 'info', tanker: 'warning', container: 'success',
  fishing: 'default', passenger: 'info', military: 'danger',
};

const MOCK: Vessel[] = [
  { mmsi: '211331640', name: 'EVER GIVEN', type: 'container', lat: 29.95, lng: 32.58, speed: 12.3, heading: 175, destination: 'Rotterdam', flag: 'PA' },
  { mmsi: '477328800', name: 'MAERSK EDINBURGH', type: 'container', lat: 51.98, lng: 3.42, speed: 14.1, heading: 220, destination: 'Felixstowe', flag: 'DK' },
  { mmsi: '636092536', name: 'PACIFIC VOYAGER', type: 'tanker', lat: 1.25, lng: 103.75, speed: 10.2, heading: 45, destination: 'Yokohama', flag: 'LR' },
  { mmsi: '538006090', name: 'MINERAL BEIJING', type: 'cargo', lat: 22.28, lng: 114.17, speed: 0.0, heading: 0, destination: 'Hong Kong', flag: 'MH' },
  { mmsi: '244780520', name: 'NORDLAKE', type: 'cargo', lat: 53.55, lng: 6.92, speed: 11.5, heading: 270, destination: 'Bremerhaven', flag: 'NL' },
  { mmsi: '311042900', name: 'SYMPHONY OF THE SEAS', type: 'passenger', lat: 25.77, lng: -80.18, speed: 18.5, heading: 135, destination: 'Cozumel', flag: 'BS' },
  { mmsi: '367596000', name: 'USS GERALD FORD', type: 'military', lat: 36.85, lng: -6.30, speed: 22.0, heading: 90, destination: 'Norfolk', flag: 'US' },
  { mmsi: '257862000', name: 'ATLANTIC STAR', type: 'fishing', lat: 62.00, lng: -6.75, speed: 3.2, heading: 15, destination: 'Torshavn', flag: 'NO' },
  { mmsi: '413456780', name: 'COSCO SHIPPING LEO', type: 'container', lat: 31.35, lng: 121.50, speed: 0.5, heading: 180, destination: 'Shanghai', flag: 'CN' },
  { mmsi: '255805680', name: 'BRITISH PIONEER', type: 'tanker', lat: 26.20, lng: 56.40, speed: 13.8, heading: 200, destination: 'Fujairah', flag: 'PT' },
  { mmsi: '371983000', name: 'CAPE TAINARO', type: 'cargo', lat: -33.85, lng: 18.45, speed: 12.0, heading: 310, destination: 'Santos', flag: 'PA' },
  { mmsi: '636017505', name: 'EAGLE TAMPA', type: 'tanker', lat: 29.35, lng: -88.80, speed: 9.5, heading: 350, destination: 'Houston', flag: 'LR' },
  { mmsi: '477995500', name: 'OOCL HONG KONG', type: 'container', lat: 4.10, lng: 73.50, speed: 15.2, heading: 270, destination: 'Colombo', flag: 'HK' },
  { mmsi: '244110685', name: 'WILLEM BARENTSZ', type: 'fishing', lat: 71.20, lng: 25.50, speed: 4.1, heading: 60, destination: 'Tromso', flag: 'NL' },
  { mmsi: '538004245', name: 'STENA IMPERO', type: 'tanker', lat: 12.60, lng: 43.30, speed: 11.0, heading: 340, destination: 'Ras Tanura', flag: 'MH' },
  { mmsi: '311000758', name: 'CARNIVAL VISTA', type: 'passenger', lat: 18.45, lng: -64.95, speed: 16.3, heading: 180, destination: 'St. Thomas', flag: 'BS' },
  { mmsi: '269057489', name: 'MSC OSCAR', type: 'container', lat: 13.80, lng: 42.95, speed: 16.0, heading: 340, destination: 'Jeddah', flag: 'CH' },
  { mmsi: '353136000', name: 'VALE BRASIL', type: 'cargo', lat: -23.95, lng: -46.30, speed: 0.0, heading: 90, destination: 'Santos', flag: 'PA' },
  { mmsi: '563043600', name: 'PACIFIC RUBY', type: 'cargo', lat: 34.70, lng: 139.75, speed: 10.8, heading: 200, destination: 'Tokyo', flag: 'SG' },
  { mmsi: '367780000', name: 'USS NIMITZ', type: 'military', lat: 32.70, lng: -117.20, speed: 0.0, heading: 0, destination: 'San Diego', flag: 'US' },
  { mmsi: '246289000', name: 'DUTCH SPIRIT', type: 'fishing', lat: 51.95, lng: 1.85, speed: 2.8, heading: 110, destination: 'IJmuiden', flag: 'NL' },
  { mmsi: '636091400', name: 'FRONT ALTO', type: 'tanker', lat: -5.50, lng: 39.10, speed: 14.2, heading: 20, destination: 'Mombasa', flag: 'LR' },
  { mmsi: '477776500', name: 'YANG MING WISH', type: 'container', lat: 22.30, lng: 120.30, speed: 17.5, heading: 0, destination: 'Kaohsiung', flag: 'HK' },
  { mmsi: '538007936', name: 'GOLDEN STAR', type: 'cargo', lat: 37.95, lng: -122.35, speed: 0.0, heading: 45, destination: 'Oakland', flag: 'MH' },
  { mmsi: '311005600', name: 'QUEEN MARY 2', type: 'passenger', lat: 50.85, lng: -1.40, speed: 0.5, heading: 180, destination: 'Southampton', flag: 'BM' },
  { mmsi: '246601000', name: 'ARCTIC SUNRISE', type: 'fishing', lat: 78.20, lng: 15.60, speed: 5.0, heading: 330, destination: 'Longyearbyen', flag: 'NL' },
];

async function fetchVessels(): Promise<Vessel[]> {
  await new Promise(r => setTimeout(r, 150));
  return MOCK;
}

const VesselTracker: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling(fetchVessels, 30000);
  const items = createMemo(() => data() ?? []);
  const { filtered, filter, setFilter } = useFilter(items, (v, f) => v.type === f);

  const types = createMemo(() => {
    const counts: Record<string, number> = {};
    items().forEach(v => { counts[v.type] = (counts[v.type] || 0) + 1; });
    return counts;
  });

  const stats = createMemo(() => [
    { label: 'Total', value: items().length },
    { label: 'Cargo', value: types()['cargo'] ?? 0 },
    { label: 'Tanker', value: types()['tanker'] ?? 0 },
    { label: 'Container', value: types()['container'] ?? 0 },
  ]);

  useMapLayer(props, () => {
    const d = filtered();
    if (!d.length) return null;
    return [createScatterLayer(`${props.instanceId}-vessels`, d, {
      getPosition: (v: Vessel) => [v.lng, v.lat],
      getFillColor: (v: Vessel) => TYPE_COLORS[v.type] ?? [200, 200, 200, 180],
      radiusMinPixels: 4,
      radiusMaxPixels: 12,
    })];
  });

  const options = () => ['All', 'cargo', 'tanker', 'container', 'fishing', 'passenger', 'military'];

  return (
    <AppletShell title="Vessel Tracker" status={loading() ? 'loading' : 'connected'}
      statusText={loading() ? 'Updating' : `${items().length} vessels`}
      toolbar={<StatGrid stats={stats()} columns={4} />}
      headerRight={
        <select class="bg-surface-2 text-text-primary text-xs rounded px-2 py-1 border border-border"
          value={filter()} onChange={e => setFilter(e.currentTarget.value)}>
          {options().map(o => <option value={o === 'All' ? '' : o}>{o}</option>)}
        </select>
      }>
      <DataList items={filtered} loading={loading} error={error}
        renderItem={(v: Vessel) => (
          <div class="px-3 py-2 hover:bg-surface-2 transition-colors">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium truncate">{v.name}</span>
              <Badge text={v.type} variant={BADGE_VARIANT[v.type] ?? 'default'} />
            </div>
            <div class="flex gap-3 mt-1 text-xs text-text-secondary">
              <span>{v.speed.toFixed(1)} kn</span>
              <span>{v.heading}&deg;</span>
              <span>{v.flag}</span>
              <span class="truncate">-&gt; {v.destination}</span>
            </div>
          </div>
        )} />
    </AppletShell>
  );
};

export default VesselTracker;
