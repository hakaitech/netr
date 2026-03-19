// ============================================================================
// AIR QUALITY — Global AQI readings with pollutant data
// ============================================================================

import { Component, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, DataList, Badge, usePolling, useMapLayer, useFilter,
  createScatterLayer, colorScale,
} from '../../sdk';

export const manifest: AppletManifest = {
  id: 'air-quality',
  name: 'Air Quality',
  description: 'Global AQI readings with pollutant breakdown by city',
  category: 'environment',
  icon: 'wind',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 300_000,
  requiresMap: true,
};

type AqiCategory = 'good' | 'moderate' | 'unhealthy-sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous';

interface AqiReading {
  id: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  aqi: number;
  pollutant: 'PM2.5' | 'PM10' | 'O3' | 'NO2' | 'CO';
  category: AqiCategory;
}

const CAT_VARIANT: Record<AqiCategory, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  'good': 'success', 'moderate': 'warning', 'unhealthy-sensitive': 'warning',
  'unhealthy': 'danger', 'very-unhealthy': 'danger', 'hazardous': 'danger',
};

const CAT_LABEL: Record<AqiCategory, string> = {
  'good': 'Good', 'moderate': 'Moderate', 'unhealthy-sensitive': 'USG',
  'unhealthy': 'Unhealthy', 'very-unhealthy': 'Very Unhealthy', 'hazardous': 'Hazardous',
};

const AQI_PALETTE: [number, number, number, number][] = [
  [34, 197, 94, 200],   // green  - good
  [250, 204, 21, 200],  // yellow - moderate
  [245, 158, 11, 200],  // orange - USG
  [239, 68, 68, 200],   // red    - unhealthy
  [168, 85, 247, 220],  // purple - very unhealthy
  [128, 0, 0, 240],     // maroon - hazardous
];

const MOCK: AqiReading[] = [
  { id: 'a1', city: 'Delhi', country: 'IN', lat: 28.61, lng: 77.21, aqi: 312, pollutant: 'PM2.5', category: 'hazardous' },
  { id: 'a2', city: 'Beijing', country: 'CN', lat: 39.90, lng: 116.40, aqi: 178, pollutant: 'PM2.5', category: 'unhealthy' },
  { id: 'a3', city: 'Los Angeles', country: 'US', lat: 34.05, lng: -118.24, aqi: 95, pollutant: 'O3', category: 'moderate' },
  { id: 'a4', city: 'London', country: 'GB', lat: 51.51, lng: -0.13, aqi: 42, pollutant: 'NO2', category: 'good' },
  { id: 'a5', city: 'Cairo', country: 'EG', lat: 30.04, lng: 31.24, aqi: 165, pollutant: 'PM10', category: 'unhealthy' },
  { id: 'a6', city: 'Tokyo', country: 'JP', lat: 35.68, lng: 139.69, aqi: 55, pollutant: 'PM2.5', category: 'moderate' },
  { id: 'a7', city: 'Dhaka', country: 'BD', lat: 23.81, lng: 90.41, aqi: 280, pollutant: 'PM2.5', category: 'very-unhealthy' },
  { id: 'a8', city: 'Paris', country: 'FR', lat: 48.86, lng: 2.35, aqi: 38, pollutant: 'NO2', category: 'good' },
  { id: 'a9', city: 'Lagos', country: 'NG', lat: 6.52, lng: 3.38, aqi: 142, pollutant: 'PM10', category: 'unhealthy-sensitive' },
  { id: 'a10', city: 'Sao Paulo', country: 'BR', lat: -23.55, lng: -46.63, aqi: 78, pollutant: 'CO', category: 'moderate' },
  { id: 'a11', city: 'Lahore', country: 'PK', lat: 31.55, lng: 74.35, aqi: 345, pollutant: 'PM2.5', category: 'hazardous' },
  { id: 'a12', city: 'Seoul', country: 'KR', lat: 37.57, lng: 126.98, aqi: 88, pollutant: 'PM2.5', category: 'moderate' },
  { id: 'a13', city: 'Mexico City', country: 'MX', lat: 19.43, lng: -99.13, aqi: 120, pollutant: 'O3', category: 'unhealthy-sensitive' },
  { id: 'a14', city: 'Jakarta', country: 'ID', lat: -6.21, lng: 106.85, aqi: 155, pollutant: 'PM2.5', category: 'unhealthy' },
  { id: 'a15', city: 'Sydney', country: 'AU', lat: -33.87, lng: 151.21, aqi: 28, pollutant: 'O3', category: 'good' },
  { id: 'a16', city: 'Zurich', country: 'CH', lat: 47.37, lng: 8.54, aqi: 22, pollutant: 'NO2', category: 'good' },
  { id: 'a17', city: 'Ulaanbaatar', country: 'MN', lat: 47.92, lng: 106.92, aqi: 220, pollutant: 'PM2.5', category: 'very-unhealthy' },
  { id: 'a18', city: 'Karachi', country: 'PK', lat: 24.86, lng: 67.01, aqi: 198, pollutant: 'PM10', category: 'unhealthy' },
  { id: 'a19', city: 'Stockholm', country: 'SE', lat: 59.33, lng: 18.07, aqi: 18, pollutant: 'NO2', category: 'good' },
  { id: 'a20', city: 'Hanoi', country: 'VN', lat: 21.03, lng: 105.85, aqi: 168, pollutant: 'PM2.5', category: 'unhealthy' },
  { id: 'a21', city: 'Bogota', country: 'CO', lat: 4.71, lng: -74.07, aqi: 62, pollutant: 'PM2.5', category: 'moderate' },
];

function fetchMock(): Promise<AqiReading[]> {
  return new Promise((r) => setTimeout(() => r(MOCK), 250));
}

const AirQuality: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling<AqiReading[]>(fetchMock, 300_000);
  const items = createMemo(() => (data() ?? []).sort((a, b) => b.aqi - a.aqi));

  const { filtered, filter, setFilter } = useFilter<AqiReading>(
    items,
    (item, f) => item.category === f,
  );

  useMapLayer(props, () => {
    const d = filtered();
    if (!d.length) return null;
    return [createScatterLayer(`${props.instanceId}-aqi`, d, {
      getPosition: (r: AqiReading) => [r.lng, r.lat],
      getRadius: 45000,
      getFillColor: (r: AqiReading) => colorScale(r.aqi, 0, 500, AQI_PALETTE),
      radiusMinPixels: 5,
      radiusMaxPixels: 20,
    })];
  });

  const categories: AqiCategory[] = ['good', 'moderate', 'unhealthy-sensitive', 'unhealthy', 'very-unhealthy', 'hazardous'];

  return (
    <AppletShell
      title="Air Quality Index"
      status={loading() ? 'loading' : error() ? 'error' : 'connected'}
      statusText={`${items().length} cities`}
      headerRight={
        <select
          class="bg-surface-2 text-text-primary text-xs rounded px-2 py-1 border border-border"
          value={filter()}
          onChange={(e) => setFilter(e.currentTarget.value)}
        >
          <option value="">All</option>
          {categories.map((c) => <option value={c}>{CAT_LABEL[c]}</option>)}
        </select>
      }
    >
      <DataList
        items={filtered}
        loading={loading}
        error={error}
        renderItem={(reading) => (
          <div class="flex items-center gap-3 px-3 py-2 hover:bg-surface-2 transition-colors">
            <div
              class="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{
                'background-color': `rgba(${colorScale(reading.aqi, 0, 500, AQI_PALETTE).join(',')})`,
              }}
            >
              {reading.aqi}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium truncate">{reading.city}, {reading.country}</p>
                <Badge text={CAT_LABEL[reading.category]} variant={CAT_VARIANT[reading.category]} />
              </div>
              <p class="text-xs text-text-secondary mt-0.5">
                Dominant: {reading.pollutant}
              </p>
            </div>
          </div>
        )}
      />
    </AppletShell>
  );
};

export default AirQuality;
