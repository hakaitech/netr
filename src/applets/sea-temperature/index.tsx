// ============================================================================
// SEA TEMPERATURE — Ocean surface temperature with anomaly tracking
// ============================================================================

import { Component, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, DataList, Badge, Sparkline, usePolling, useMapLayer,
  createScatterLayer, colorScale, formatNumber,
} from '../../sdk';

export const manifest: AppletManifest = {
  id: 'sea-temperature',
  name: 'Sea Temperature',
  description: 'Ocean surface temperature anomalies and trends',
  category: 'environment',
  icon: 'thermometer',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 600_000,
  requiresMap: true,
};

interface OceanRegion {
  id: string;
  name: string;
  lat: number;
  lng: number;
  tempC: number;
  anomalyC: number;
  trend: 'warming' | 'cooling' | 'stable';
  history: number[];
}

const TREND_VARIANT: Record<string, 'danger' | 'info' | 'default'> = {
  warming: 'danger', cooling: 'info', stable: 'default',
};

const ANOMALY_PALETTE: [number, number, number, number][] = [
  [59, 130, 246, 220],   // deep blue  (cold anomaly)
  [147, 197, 253, 180],  // light blue
  [200, 200, 200, 160],  // neutral
  [251, 191, 36, 200],   // warm
  [239, 68, 68, 230],    // hot anomaly
];

const MOCK: OceanRegion[] = [
  { id: 's1', name: 'Nino 3.4 (Equatorial Pacific)', lat: 0.0, lng: -160.0, tempC: 27.8, anomalyC: 1.5, trend: 'warming', history: [26.5, 26.8, 27.0, 27.3, 27.5, 27.8] },
  { id: 's2', name: 'North Atlantic Drift', lat: 52.0, lng: -25.0, tempC: 14.2, anomalyC: 0.8, trend: 'warming', history: [13.2, 13.5, 13.8, 14.0, 14.1, 14.2] },
  { id: 's3', name: 'Gulf Stream (Florida)', lat: 27.0, lng: -79.0, tempC: 26.5, anomalyC: 0.4, trend: 'stable', history: [26.1, 26.3, 26.4, 26.5, 26.5, 26.5] },
  { id: 's4', name: 'Kuroshio Current', lat: 32.0, lng: 135.0, tempC: 22.1, anomalyC: -0.3, trend: 'cooling', history: [22.5, 22.4, 22.3, 22.2, 22.1, 22.1] },
  { id: 's5', name: 'Southern Ocean (Drake Passage)', lat: -58.0, lng: -65.0, tempC: 4.2, anomalyC: 1.1, trend: 'warming', history: [3.5, 3.7, 3.9, 4.0, 4.1, 4.2] },
  { id: 's6', name: 'Arabian Sea', lat: 15.0, lng: 65.0, tempC: 28.9, anomalyC: 0.6, trend: 'warming', history: [28.2, 28.4, 28.5, 28.7, 28.8, 28.9] },
  { id: 's7', name: 'Bay of Bengal', lat: 14.0, lng: 88.0, tempC: 29.3, anomalyC: 0.9, trend: 'warming', history: [28.5, 28.7, 29.0, 29.1, 29.2, 29.3] },
  { id: 's8', name: 'Coral Sea', lat: -18.0, lng: 155.0, tempC: 27.5, anomalyC: 1.2, trend: 'warming', history: [26.5, 26.8, 27.0, 27.2, 27.4, 27.5] },
  { id: 's9', name: 'Norwegian Sea', lat: 68.0, lng: 5.0, tempC: 7.8, anomalyC: 0.3, trend: 'stable', history: [7.5, 7.6, 7.7, 7.7, 7.8, 7.8] },
  { id: 's10', name: 'Humboldt Current (Peru)', lat: -15.0, lng: -76.0, tempC: 18.5, anomalyC: -0.8, trend: 'cooling', history: [19.2, 19.0, 18.8, 18.7, 18.6, 18.5] },
  { id: 's11', name: 'Benguela Current', lat: -25.0, lng: 12.0, tempC: 16.0, anomalyC: -0.5, trend: 'cooling', history: [16.4, 16.3, 16.2, 16.1, 16.0, 16.0] },
  { id: 's12', name: 'Mediterranean (Central)', lat: 36.0, lng: 18.0, tempC: 20.5, anomalyC: 1.8, trend: 'warming', history: [19.0, 19.4, 19.8, 20.1, 20.3, 20.5] },
  { id: 's13', name: 'Arctic (Barents Sea)', lat: 74.0, lng: 35.0, tempC: 3.5, anomalyC: 2.1, trend: 'warming', history: [2.0, 2.4, 2.8, 3.1, 3.3, 3.5] },
  { id: 's14', name: 'South China Sea', lat: 12.0, lng: 115.0, tempC: 29.0, anomalyC: 0.5, trend: 'stable', history: [28.6, 28.7, 28.8, 28.9, 29.0, 29.0] },
  { id: 's15', name: 'Tasman Sea', lat: -38.0, lng: 160.0, tempC: 16.8, anomalyC: -0.2, trend: 'stable', history: [16.9, 16.9, 16.8, 16.8, 16.8, 16.8] },
];

function fetchMock(): Promise<OceanRegion[]> {
  return new Promise((r) => setTimeout(() => r(MOCK), 250));
}

const SeaTemperature: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling<OceanRegion[]>(fetchMock, 600_000);
  const items = createMemo(() => (data() ?? []).sort((a, b) => b.anomalyC - a.anomalyC));

  useMapLayer(props, () => {
    const d = items();
    if (!d.length) return null;
    return [createScatterLayer(`${props.instanceId}-sst`, d, {
      getPosition: (r: OceanRegion) => [r.lng, r.lat],
      getRadius: 80000,
      getFillColor: (r: OceanRegion) => colorScale(r.anomalyC, -1.5, 2.5, ANOMALY_PALETTE),
      radiusMinPixels: 6,
      radiusMaxPixels: 22,
    })];
  });

  return (
    <AppletShell
      title="Sea Temperature"
      status={loading() ? 'loading' : error() ? 'error' : 'connected'}
      statusText={`${items().length} regions`}
    >
      <DataList
        items={items}
        loading={loading}
        error={error}
        renderItem={(region) => (
          <div class="flex items-center gap-3 px-3 py-2 hover:bg-surface-2 transition-colors">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium truncate">{region.name}</p>
                <Badge text={region.trend} variant={TREND_VARIANT[region.trend]} />
              </div>
              <div class="flex items-center gap-3 mt-1">
                <span class="text-xs text-text-secondary">{region.tempC}&deg;C</span>
                <span class={`text-xs font-semibold ${region.anomalyC > 0 ? 'text-red-400' : region.anomalyC < 0 ? 'text-blue-400' : 'text-text-secondary'}`}>
                  {region.anomalyC > 0 ? '+' : ''}{formatNumber(region.anomalyC, { decimals: 1 })}&deg;C
                </span>
                <Sparkline
                  data={region.history}
                  width={60}
                  height={18}
                  color={region.anomalyC > 0 ? '#ef4444' : region.anomalyC < 0 ? '#3b82f6' : '#9ca3af'}
                />
              </div>
            </div>
          </div>
        )}
      />
    </AppletShell>
  );
};

export default SeaTemperature;
