// ============================================================================
// WEATHER RADAR — Global weather overview with city conditions
// ============================================================================

import { Component, createSignal, createMemo, For, Show } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, DataList, StatGrid, usePolling, useMapLayer, useFilter,
  createScatterLayer, formatNumber,
} from '../../sdk';

export const manifest: AppletManifest = {
  id: 'weather-radar',
  name: 'Weather Radar',
  description: 'Global weather overview with temperature and conditions',
  category: 'environment',
  icon: 'cloud-sun',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 300_000,
  requiresMap: true,
};

interface CityWeather {
  name: string;
  country: string;
  lat: number;
  lng: number;
  tempC: number;
  condition: 'sunny' | 'cloudy' | 'rain' | 'storm' | 'snow';
  humidity: number;
  windKmh: number;
  forecast: number[];
}

const CONDITION_ICON: Record<string, string> = {
  sunny: '\u2600\uFE0F', cloudy: '\uD83C\uDF24\uFE0F', rain: '\uD83C\uDF27\uFE0F',
  storm: '\u26C8\uFE0F', snow: '\u2744\uFE0F',
};

const CONDITION_COLOR: Record<string, [number, number, number, number]> = {
  sunny: [250, 204, 21, 200], cloudy: [156, 163, 175, 200],
  rain: [96, 165, 250, 200], storm: [239, 68, 68, 200], snow: [200, 220, 255, 200],
};

const MOCK: CityWeather[] = [
  { name: 'Tokyo', country: 'JP', lat: 35.68, lng: 139.69, tempC: 18, condition: 'cloudy', humidity: 62, windKmh: 14, forecast: [19, 20, 17, 15, 18] },
  { name: 'New York', country: 'US', lat: 40.71, lng: -74.01, tempC: 12, condition: 'rain', humidity: 78, windKmh: 22, forecast: [11, 9, 10, 13, 14] },
  { name: 'London', country: 'GB', lat: 51.51, lng: -0.13, tempC: 9, condition: 'rain', humidity: 85, windKmh: 19, forecast: [8, 7, 10, 11, 9] },
  { name: 'Paris', country: 'FR', lat: 48.86, lng: 2.35, tempC: 11, condition: 'cloudy', humidity: 72, windKmh: 16, forecast: [10, 12, 13, 11, 10] },
  { name: 'Sydney', country: 'AU', lat: -33.87, lng: 151.21, tempC: 24, condition: 'sunny', humidity: 55, windKmh: 18, forecast: [25, 26, 23, 22, 24] },
  { name: 'Dubai', country: 'AE', lat: 25.20, lng: 55.27, tempC: 36, condition: 'sunny', humidity: 30, windKmh: 12, forecast: [37, 38, 36, 35, 37] },
  { name: 'Moscow', country: 'RU', lat: 55.76, lng: 37.62, tempC: -3, condition: 'snow', humidity: 88, windKmh: 25, forecast: [-5, -4, -2, 0, -1] },
  { name: 'Mumbai', country: 'IN', lat: 19.08, lng: 72.88, tempC: 32, condition: 'sunny', humidity: 68, windKmh: 10, forecast: [33, 31, 30, 32, 33] },
  { name: 'Cairo', country: 'EG', lat: 30.04, lng: 31.24, tempC: 28, condition: 'sunny', humidity: 35, windKmh: 15, forecast: [29, 30, 28, 27, 29] },
  { name: 'Sao Paulo', country: 'BR', lat: -23.55, lng: -46.63, tempC: 26, condition: 'storm', humidity: 82, windKmh: 28, forecast: [24, 22, 25, 27, 26] },
  { name: 'Beijing', country: 'CN', lat: 39.90, lng: 116.40, tempC: 14, condition: 'cloudy', humidity: 48, windKmh: 20, forecast: [13, 15, 16, 14, 12] },
  { name: 'Lagos', country: 'NG', lat: 6.52, lng: 3.38, tempC: 31, condition: 'rain', humidity: 80, windKmh: 11, forecast: [30, 29, 31, 32, 30] },
  { name: 'Mexico City', country: 'MX', lat: 19.43, lng: -99.13, tempC: 22, condition: 'sunny', humidity: 45, windKmh: 8, forecast: [23, 21, 22, 20, 22] },
  { name: 'Seoul', country: 'KR', lat: 37.57, lng: 126.98, tempC: 10, condition: 'cloudy', humidity: 55, windKmh: 17, forecast: [9, 11, 12, 10, 8] },
  { name: 'Istanbul', country: 'TR', lat: 41.01, lng: 28.98, tempC: 15, condition: 'rain', humidity: 70, windKmh: 21, forecast: [14, 13, 16, 17, 15] },
  { name: 'Buenos Aires', country: 'AR', lat: -34.60, lng: -58.38, tempC: 20, condition: 'sunny', humidity: 60, windKmh: 14, forecast: [21, 22, 19, 18, 20] },
  { name: 'Toronto', country: 'CA', lat: 43.65, lng: -79.38, tempC: 5, condition: 'snow', humidity: 75, windKmh: 30, forecast: [3, 1, 4, 6, 5] },
  { name: 'Bangkok', country: 'TH', lat: 13.76, lng: 100.50, tempC: 34, condition: 'storm', humidity: 78, windKmh: 15, forecast: [33, 35, 34, 32, 33] },
  { name: 'Nairobi', country: 'KE', lat: -1.29, lng: 36.82, tempC: 23, condition: 'cloudy', humidity: 58, windKmh: 13, forecast: [22, 24, 23, 21, 22] },
  { name: 'Berlin', country: 'DE', lat: 52.52, lng: 13.41, tempC: 7, condition: 'rain', humidity: 80, windKmh: 24, forecast: [6, 5, 8, 9, 7] },
  { name: 'Reykjavik', country: 'IS', lat: 64.15, lng: -21.94, tempC: -1, condition: 'snow', humidity: 90, windKmh: 35, forecast: [-3, -2, 0, -1, -2] },
];

function fetchMock(): Promise<CityWeather[]> {
  return new Promise((r) => setTimeout(() => r(MOCK), 300));
}

const WeatherRadar: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling<CityWeather[]>(fetchMock, 300_000);

  const items = createMemo(() => data() ?? []);

  const { filtered, filter, setFilter } = useFilter<CityWeather>(
    items,
    (item, f) => item.condition === f,
  );

  useMapLayer(props, () => {
    const d = filtered();
    if (!d.length) return null;
    return [createScatterLayer(`${props.instanceId}-weather`, d, {
      getPosition: (c: CityWeather) => [c.lng, c.lat],
      getRadius: 50000,
      getFillColor: (c: CityWeather) => CONDITION_COLOR[c.condition] ?? [150, 150, 150, 200],
      radiusMinPixels: 5,
      radiusMaxPixels: 18,
    })];
  });

  return (
    <AppletShell
      title="Weather Radar"
      status={loading() ? 'loading' : error() ? 'error' : 'connected'}
      statusText={loading() ? 'Updating...' : `${items().length} cities`}
      headerRight={
        <select
          class="bg-surface-2 text-text-primary text-xs rounded px-2 py-1 border border-border"
          value={filter()}
          onChange={(e) => setFilter(e.currentTarget.value)}
        >
          <option value="">All</option>
          {['sunny', 'cloudy', 'rain', 'storm', 'snow'].map((c) => (
            <option value={c}>{CONDITION_ICON[c]} {c}</option>
          ))}
        </select>
      }
    >
      <DataList
        items={filtered}
        loading={loading}
        error={error}
        renderItem={(city) => (
          <div class="flex items-center gap-3 px-3 py-2 hover:bg-surface-2 transition-colors">
            <span class="text-xl shrink-0 w-8 text-center">{CONDITION_ICON[city.condition]}</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{city.name}, {city.country}</p>
              <p class="text-xs text-text-secondary">
                Humidity {city.humidity}% &middot; Wind {city.windKmh} km/h
              </p>
            </div>
            <span class="text-lg font-bold tabular-nums shrink-0">{city.tempC}&deg;C</span>
          </div>
        )}
      />
    </AppletShell>
  );
};

export default WeatherRadar;
