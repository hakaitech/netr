// ============================================================================
// REFUGEE TRACKER — UNHCR-style refugee and IDP statistics by country
// ============================================================================

import { Component, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, DataList, StatGrid,
  usePolling, useMapLayer,
  createScatterLayer, formatNumber,
} from '../../sdk';

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

export const manifest: AppletManifest = {
  id: 'refugee-tracker',
  name: 'Refugee Tracker',
  description: 'Global refugee and internally displaced persons statistics',
  category: 'intelligence',
  icon: 'users',
  defaultSize: { w: 3, h: 4 },
  minSize: { w: 2, h: 3 },
  resizable: true,
  refreshInterval: 600_000,
  requiresMap: true,
};

// ---------------------------------------------------------------------------
// Types & Mock Data
// ---------------------------------------------------------------------------

interface RefugeeCountry {
  id: string;
  country: string;
  refugeesHosted: number;
  internallyDisplaced: number;
  newArrivals: number;
  lat: number;
  lng: number;
}

const MOCK: RefugeeCountry[] = [
  { id: 'r1', country: 'Turkey', refugeesHosted: 3_360_000, internallyDisplaced: 0, newArrivals: 12_400, lat: 39.93, lng: 32.86 },
  { id: 'r2', country: 'Iran', refugeesHosted: 3_400_000, internallyDisplaced: 0, newArrivals: 450_000, lat: 35.69, lng: 51.39 },
  { id: 'r3', country: 'Colombia', refugeesHosted: 2_900_000, internallyDisplaced: 6_800_000, newArrivals: 220_000, lat: 4.71, lng: -74.07 },
  { id: 'r4', country: 'Germany', refugeesHosted: 2_600_000, internallyDisplaced: 0, newArrivals: 180_000, lat: 52.52, lng: 13.41 },
  { id: 'r5', country: 'Pakistan', refugeesHosted: 2_100_000, internallyDisplaced: 1_500_000, newArrivals: 45_000, lat: 33.69, lng: 73.04 },
  { id: 'r6', country: 'Uganda', refugeesHosted: 1_620_000, internallyDisplaced: 32_000, newArrivals: 62_000, lat: 0.35, lng: 32.58 },
  { id: 'r7', country: 'Sudan', refugeesHosted: 1_100_000, internallyDisplaced: 9_100_000, newArrivals: 780_000, lat: 15.50, lng: 32.56 },
  { id: 'r8', country: 'Bangladesh', refugeesHosted: 960_000, internallyDisplaced: 0, newArrivals: 8_200, lat: 23.81, lng: 90.41 },
  { id: 'r9', country: 'Ethiopia', refugeesHosted: 940_000, internallyDisplaced: 4_400_000, newArrivals: 115_000, lat: 9.02, lng: 38.75 },
  { id: 'r10', country: 'Chad', refugeesHosted: 1_150_000, internallyDisplaced: 380_000, newArrivals: 570_000, lat: 12.13, lng: 15.06 },
  { id: 'r11', country: 'Poland', refugeesHosted: 1_600_000, internallyDisplaced: 0, newArrivals: 35_000, lat: 52.23, lng: 21.01 },
  { id: 'r12', country: 'DR Congo', refugeesHosted: 530_000, internallyDisplaced: 7_100_000, newArrivals: 1_200_000, lat: -4.32, lng: 15.31 },
  { id: 'r13', country: 'Kenya', refugeesHosted: 780_000, internallyDisplaced: 190_000, newArrivals: 48_000, lat: -1.29, lng: 36.82 },
  { id: 'r14', country: 'Syria', refugeesHosted: 0, internallyDisplaced: 7_200_000, newArrivals: 0, lat: 33.51, lng: 36.29 },
  { id: 'r15', country: 'Ukraine', refugeesHosted: 0, internallyDisplaced: 5_900_000, newArrivals: 0, lat: 50.45, lng: 30.52 },
  { id: 'r16', country: 'Yemen', refugeesHosted: 95_000, internallyDisplaced: 4_500_000, newArrivals: 22_000, lat: 15.37, lng: 44.19 },
  { id: 'r17', country: 'Myanmar', refugeesHosted: 0, internallyDisplaced: 3_000_000, newArrivals: 0, lat: 19.76, lng: 96.07 },
  { id: 'r18', country: 'South Sudan', refugeesHosted: 340_000, internallyDisplaced: 2_200_000, newArrivals: 170_000, lat: 4.85, lng: 31.60 },
  { id: 'r19', country: 'Afghanistan', refugeesHosted: 0, internallyDisplaced: 6_300_000, newArrivals: 0, lat: 34.53, lng: 69.17 },
  { id: 'r20', country: 'Somalia', refugeesHosted: 35_000, internallyDisplaced: 3_900_000, newArrivals: 320_000, lat: 2.05, lng: 45.32 },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const RefugeeTracker: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling<RefugeeCountry[]>(
    () => Promise.resolve(MOCK),
    manifest.refreshInterval!,
  );

  const sorted = createMemo(() =>
    [...(data() ?? [])].sort((a, b) => b.refugeesHosted - a.refugeesHosted),
  );

  const totals = createMemo(() => {
    const d = data() ?? [];
    return {
      refugees: d.reduce((s, c) => s + c.refugeesHosted, 0),
      idps: d.reduce((s, c) => s + c.internallyDisplaced, 0),
      countries: d.length,
    };
  });

  useMapLayer(props, () => {
    const d = sorted();
    if (!d.length) return null;
    return [createScatterLayer(`${props.instanceId}-refugees`, d, {
      getPosition: (r: RefugeeCountry) => [r.lng, r.lat],
      getRadius: (r: RefugeeCountry) => Math.sqrt(r.refugeesHosted + r.internallyDisplaced) * 50,
      getFillColor: () => [59, 130, 246, 180],
      radiusMinPixels: 4,
      radiusMaxPixels: 40,
    })];
  });

  return (
    <AppletShell
      title="Refugee Tracker"
      status={loading() ? 'loading' : error() ? 'error' : 'connected'}
      statusText={loading() ? 'Updating...' : `${sorted().length} countries`}
      toolbar={
        <StatGrid
          stats={[
            { label: 'Refugees', value: formatNumber(totals().refugees, { compact: true }), color: 'text-blue-400' },
            { label: 'IDPs', value: formatNumber(totals().idps, { compact: true }), color: 'text-amber-400' },
            { label: 'Countries', value: totals().countries, color: 'text-emerald-400' },
          ]}
          columns={3}
        />
      }
    >
      <DataList
        items={sorted}
        loading={loading}
        error={error}
        renderItem={(r: RefugeeCountry) => (
          <div class="px-3 py-2.5 hover:bg-surface-2 transition-colors">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">{r.country}</span>
              <span class="text-xs text-blue-400 font-semibold tabular-nums">
                {formatNumber(r.refugeesHosted, { compact: true })} hosted
              </span>
            </div>
            <div class="flex items-center gap-3 mt-1 text-xs text-text-secondary">
              <span>IDPs: {formatNumber(r.internallyDisplaced, { compact: true })}</span>
              <span>New arrivals: {formatNumber(r.newArrivals, { compact: true })}</span>
            </div>
          </div>
        )}
      />
    </AppletShell>
  );
};

export default RefugeeTracker;
