// ============================================================================
// DROUGHT MONITOR — Regional drought severity tracking
// ============================================================================

import { Component, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, DataList, StatGrid, Badge, usePolling, useMapLayer,
  createScatterLayer, formatNumber,
} from '../../sdk';

export const manifest: AppletManifest = {
  id: 'drought-monitor',
  name: 'Drought Monitor',
  description: 'Regional drought severity with population and crop impact data',
  category: 'environment',
  icon: 'droplets',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 600_000,
  requiresMap: true,
};

type Severity = 'D0' | 'D1' | 'D2' | 'D3' | 'D4';

interface DroughtRegion {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  severity: Severity;
  populationAffected: number;
  areaSqKm: number;
  cropImpactPct: number;
}

const SEV_LABEL: Record<Severity, string> = {
  D0: 'Abnormally Dry', D1: 'Moderate', D2: 'Severe', D3: 'Extreme', D4: 'Exceptional',
};

const SEV_VARIANT: Record<Severity, 'default' | 'info' | 'warning' | 'danger'> = {
  D0: 'default', D1: 'info', D2: 'warning', D3: 'danger', D4: 'danger',
};

const SEV_COLOR: Record<Severity, [number, number, number, number]> = {
  D0: [255, 255, 0, 180], D1: [252, 211, 127, 200], D2: [245, 158, 11, 220],
  D3: [239, 68, 68, 230], D4: [128, 0, 0, 240],
};

const MOCK: DroughtRegion[] = [
  { id: 'd1', name: 'Horn of Africa', country: 'ET/KE/SO', lat: 4.0, lng: 42.0, severity: 'D4', populationAffected: 23000000, areaSqKm: 580000, cropImpactPct: 82 },
  { id: 'd2', name: 'Central Valley', country: 'US', lat: 36.78, lng: -119.42, severity: 'D3', populationAffected: 6500000, areaSqKm: 47000, cropImpactPct: 65 },
  { id: 'd3', name: 'Sahel Region', country: 'NE/ML/BF', lat: 14.0, lng: 2.0, severity: 'D4', populationAffected: 18000000, areaSqKm: 750000, cropImpactPct: 78 },
  { id: 'd4', name: 'Rajasthan', country: 'IN', lat: 27.0, lng: 71.0, severity: 'D3', populationAffected: 12000000, areaSqKm: 120000, cropImpactPct: 58 },
  { id: 'd5', name: 'Southern Spain', country: 'ES', lat: 37.39, lng: -3.0, severity: 'D2', populationAffected: 4200000, areaSqKm: 85000, cropImpactPct: 45 },
  { id: 'd6', name: 'Northeast Brazil', country: 'BR', lat: -8.0, lng: -38.0, severity: 'D2', populationAffected: 9000000, areaSqKm: 350000, cropImpactPct: 40 },
  { id: 'd7', name: 'Murray-Darling Basin', country: 'AU', lat: -33.0, lng: 145.0, severity: 'D2', populationAffected: 2100000, areaSqKm: 106000, cropImpactPct: 52 },
  { id: 'd8', name: 'Northern China Plain', country: 'CN', lat: 36.5, lng: 116.0, severity: 'D1', populationAffected: 15000000, areaSqKm: 300000, cropImpactPct: 28 },
  { id: 'd9', name: 'Southwest US', country: 'US', lat: 34.0, lng: -112.0, severity: 'D3', populationAffected: 8500000, areaSqKm: 310000, cropImpactPct: 55 },
  { id: 'd10', name: 'Sicily', country: 'IT', lat: 37.5, lng: 14.0, severity: 'D1', populationAffected: 1800000, areaSqKm: 25000, cropImpactPct: 32 },
  { id: 'd11', name: 'Central Chile', country: 'CL', lat: -33.5, lng: -70.5, severity: 'D2', populationAffected: 3200000, areaSqKm: 95000, cropImpactPct: 48 },
  { id: 'd12', name: 'Southern Madagascar', country: 'MG', lat: -24.0, lng: 45.5, severity: 'D4', populationAffected: 1500000, areaSqKm: 42000, cropImpactPct: 88 },
  { id: 'd13', name: 'Punjab', country: 'PK', lat: 30.2, lng: 71.5, severity: 'D1', populationAffected: 5000000, areaSqKm: 75000, cropImpactPct: 22 },
  { id: 'd14', name: 'Great Plains', country: 'US', lat: 40.0, lng: -100.0, severity: 'D0', populationAffected: 2800000, areaSqKm: 210000, cropImpactPct: 15 },
  { id: 'd15', name: 'Maghreb Coast', country: 'MA/DZ/TN', lat: 34.0, lng: 3.0, severity: 'D2', populationAffected: 7200000, areaSqKm: 180000, cropImpactPct: 42 },
];

function fetchMock(): Promise<DroughtRegion[]> {
  return new Promise((r) => setTimeout(() => r(MOCK), 250));
}

const DroughtMonitor: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling<DroughtRegion[]>(fetchMock, 600_000);
  const items = createMemo(() => (data() ?? []).sort((a, b) => b.severity.localeCompare(a.severity)));

  const stats = createMemo(() => {
    const d = items();
    const totalPop = d.reduce((s, r) => s + r.populationAffected, 0);
    const severe = d.filter((r) => ['D3', 'D4'].includes(r.severity)).length;
    return [
      { label: 'Regions', value: d.length },
      { label: 'Population', value: formatNumber(totalPop, { compact: true }) },
      { label: 'Extreme/Exceptional', value: severe, color: 'text-red-400' },
    ];
  });

  useMapLayer(props, () => {
    const d = items();
    if (!d.length) return null;
    return [createScatterLayer(`${props.instanceId}-drought`, d, {
      getPosition: (r: DroughtRegion) => [r.lng, r.lat],
      getRadius: (r: DroughtRegion) => Math.sqrt(r.areaSqKm) * 200,
      getFillColor: (r: DroughtRegion) => SEV_COLOR[r.severity],
      radiusMinPixels: 5,
      radiusMaxPixels: 35,
    })];
  });

  return (
    <AppletShell
      title="Drought Monitor"
      status={loading() ? 'loading' : error() ? 'error' : 'connected'}
      statusText={`${items().length} regions`}
      toolbar={<StatGrid stats={stats()} columns={3} />}
    >
      <DataList
        items={items}
        loading={loading}
        error={error}
        renderItem={(region) => (
          <div class="flex items-start gap-3 px-3 py-2 hover:bg-surface-2 transition-colors">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium truncate">{region.name}</p>
                <Badge text={`${region.severity} ${SEV_LABEL[region.severity]}`} variant={SEV_VARIANT[region.severity]} />
              </div>
              <p class="text-xs text-text-secondary mt-0.5">
                {region.country} &middot; {formatNumber(region.populationAffected, { compact: true })} affected
              </p>
              <p class="text-xs text-text-secondary">
                {formatNumber(region.areaSqKm)} km&sup2; &middot; Crop impact: {region.cropImpactPct}%
              </p>
            </div>
          </div>
        )}
      />
    </AppletShell>
  );
};

export default DroughtMonitor;
