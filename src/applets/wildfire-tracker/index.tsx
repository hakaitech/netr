// ============================================================================
// WILDFIRE TRACKER — Active wildfire monitoring with area visualization
// ============================================================================

import { Component, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, DataList, StatGrid, Badge, usePolling, useMapLayer, useFilter,
  createScatterLayer, formatNumber,
} from '../../sdk';

export const manifest: AppletManifest = {
  id: 'wildfire-tracker',
  name: 'Wildfire Tracker',
  description: 'Active wildfire monitoring with area and containment data',
  category: 'environment',
  icon: 'flame',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 120_000,
  requiresMap: true,
};

interface Wildfire {
  id: string;
  name: string;
  location: string;
  country: string;
  lat: number;
  lng: number;
  areaAcres: number;
  containment: number;
  confidence: 'high' | 'medium' | 'low';
  detectedDate: string;
}

const CONFIDENCE_VARIANT: Record<string, 'danger' | 'warning' | 'info'> = {
  high: 'danger', medium: 'warning', low: 'info',
};

const MOCK: Wildfire[] = [
  { id: 'wf1', name: 'Park Fire', location: 'Butte County, CA', country: 'US', lat: 39.92, lng: -121.60, areaAcres: 429000, containment: 72, confidence: 'high', detectedDate: '2026-03-01' },
  { id: 'wf2', name: 'Jasper Complex', location: 'Jasper, AB', country: 'CA', lat: 52.87, lng: -118.08, areaAcres: 89000, containment: 45, confidence: 'high', detectedDate: '2026-03-05' },
  { id: 'wf3', name: 'Attica Blaze', location: 'Attica, Attica', country: 'GR', lat: 38.05, lng: 23.72, areaAcres: 34000, containment: 30, confidence: 'high', detectedDate: '2026-03-08' },
  { id: 'wf4', name: 'Pantanal Burn', location: 'Mato Grosso', country: 'BR', lat: -16.50, lng: -56.30, areaAcres: 210000, containment: 10, confidence: 'medium', detectedDate: '2026-02-20' },
  { id: 'wf5', name: 'Siberian Front', location: 'Yakutia', country: 'RU', lat: 62.00, lng: 130.00, areaAcres: 520000, containment: 5, confidence: 'medium', detectedDate: '2026-03-02' },
  { id: 'wf6', name: 'Blue Mountains', location: 'NSW', country: 'AU', lat: -33.72, lng: 150.31, areaAcres: 67000, containment: 55, confidence: 'high', detectedDate: '2026-03-10' },
  { id: 'wf7', name: 'Algarve Wildfire', location: 'Faro', country: 'PT', lat: 37.02, lng: -7.93, areaAcres: 18000, containment: 80, confidence: 'high', detectedDate: '2026-03-12' },
  { id: 'wf8', name: 'Chaco Grassfire', location: 'Chaco', country: 'AR', lat: -26.50, lng: -60.50, areaAcres: 45000, containment: 20, confidence: 'low', detectedDate: '2026-03-06' },
  { id: 'wf9', name: 'Kalimantan Peat', location: 'Borneo', country: 'ID', lat: -1.50, lng: 116.00, areaAcres: 120000, containment: 15, confidence: 'medium', detectedDate: '2026-02-28' },
  { id: 'wf10', name: 'Sierra Norte', location: 'Oaxaca', country: 'MX', lat: 17.08, lng: -96.72, areaAcres: 22000, containment: 60, confidence: 'high', detectedDate: '2026-03-09' },
  { id: 'wf11', name: 'Limpopo Bush', location: 'Limpopo', country: 'ZA', lat: -23.40, lng: 29.45, areaAcres: 31000, containment: 35, confidence: 'medium', detectedDate: '2026-03-07' },
  { id: 'wf12', name: 'Hokkaido Ridge', location: 'Hokkaido', country: 'JP', lat: 43.06, lng: 141.35, areaAcres: 8000, containment: 90, confidence: 'low', detectedDate: '2026-03-14' },
  { id: 'wf13', name: 'Tenerife Crown', location: 'Canary Islands', country: 'ES', lat: 28.29, lng: -16.63, areaAcres: 15000, containment: 65, confidence: 'high', detectedDate: '2026-03-11' },
  { id: 'wf14', name: 'Congo Basin', location: 'Equateur', country: 'CD', lat: 0.50, lng: 20.00, areaAcres: 95000, containment: 8, confidence: 'low', detectedDate: '2026-03-03' },
  { id: 'wf15', name: 'Alberta Foothills', location: 'Rocky Mountain House', country: 'CA', lat: 52.37, lng: -114.92, areaAcres: 42000, containment: 40, confidence: 'medium', detectedDate: '2026-03-04' },
];

function fetchMock(): Promise<Wildfire[]> {
  return new Promise((r) => setTimeout(() => r(MOCK), 250));
}

const WildfireTracker: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling<Wildfire[]>(fetchMock, 120_000);
  const items = createMemo(() => data() ?? []);

  const { filtered, filter, setFilter } = useFilter<Wildfire>(
    items,
    (item, f) => item.confidence === f,
  );

  const stats = createMemo(() => {
    const d = items();
    const countries = new Set(d.map((f) => f.country));
    return [
      { label: 'Active Fires', value: d.length, color: 'text-red-400' },
      { label: 'Total Area', value: formatNumber(d.reduce((s, f) => s + f.areaAcres, 0), { compact: true }) + ' ac' },
      { label: 'Countries', value: countries.size, color: 'text-amber-400' },
    ];
  });

  useMapLayer(props, () => {
    const d = filtered();
    if (!d.length) return null;
    return [createScatterLayer(`${props.instanceId}-wildfires`, d, {
      getPosition: (f: Wildfire) => [f.lng, f.lat],
      getRadius: (f: Wildfire) => Math.sqrt(f.areaAcres) * 50,
      getFillColor: (f: Wildfire) =>
        f.containment < 30 ? [239, 68, 68, 220] as [number, number, number, number]
        : f.containment < 60 ? [245, 158, 11, 200] as [number, number, number, number]
        : [250, 204, 21, 180] as [number, number, number, number],
      radiusMinPixels: 4,
      radiusMaxPixels: 50,
    })];
  });

  return (
    <AppletShell
      title="Wildfire Tracker"
      status={loading() ? 'loading' : error() ? 'error' : 'connected'}
      statusText={loading() ? 'Loading...' : `${items().length} fires`}
      headerRight={
        <select
          class="bg-surface-2 text-text-primary text-xs rounded px-2 py-1 border border-border"
          value={filter()}
          onChange={(e) => setFilter(e.currentTarget.value)}
        >
          <option value="">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      }
      toolbar={<StatGrid stats={stats()} columns={3} />}
    >
      <DataList
        items={filtered}
        loading={loading}
        error={error}
        renderItem={(fire) => (
          <div class="flex items-start gap-3 px-3 py-2 hover:bg-surface-2 transition-colors">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium truncate">{fire.name}</p>
                <Badge text={fire.confidence} variant={CONFIDENCE_VARIANT[fire.confidence]} />
              </div>
              <p class="text-xs text-text-secondary mt-0.5">
                {fire.location}, {fire.country}
              </p>
              <p class="text-xs text-text-secondary">
                {formatNumber(fire.areaAcres)} acres &middot; {fire.containment}% contained
              </p>
            </div>
            <div class="text-right shrink-0">
              <div class="w-16 bg-surface-3 rounded-full h-1.5 mt-1">
                <div
                  class="h-1.5 rounded-full"
                  style={{
                    width: `${fire.containment}%`,
                    'background-color': fire.containment > 60 ? '#34d399' : fire.containment > 30 ? '#fbbf24' : '#ef4444',
                  }}
                />
              </div>
              <p class="text-[10px] text-text-secondary mt-0.5">{fire.containment}%</p>
            </div>
          </div>
        )}
      />
    </AppletShell>
  );
};

export default WildfireTracker;
