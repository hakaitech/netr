// ============================================================================
// PROTEST TRACKER — Civil unrest and demonstration events worldwide
// ============================================================================

import { Component, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, DataList, FilterBar, Badge,
  usePolling, useMapLayer, useFilter,
  createScatterLayer, timeAgo,
} from '../../sdk';

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

export const manifest: AppletManifest = {
  id: 'protest-tracker',
  name: 'Protest Tracker',
  description: 'Civil unrest, demonstrations, and protest movements globally',
  category: 'intelligence',
  icon: 'megaphone',
  defaultSize: { w: 3, h: 4 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 300_000,
  requiresMap: true,
};

// ---------------------------------------------------------------------------
// Types & Mock Data
// ---------------------------------------------------------------------------

type ProtestSize = 'Small' | 'Medium' | 'Large' | 'Massive';
type ProtestCause = 'Economic' | 'Political' | 'Environmental' | 'Labor';

interface Protest {
  id: string;
  location: string;
  country: string;
  lat: number;
  lng: number;
  size: ProtestSize;
  cause: ProtestCause;
  date: number;
  description: string;
}

const SIZE_RADIUS: Record<ProtestSize, number> = {
  Small: 20000,
  Medium: 50000,
  Large: 100000,
  Massive: 180000,
};

const SIZE_VARIANTS: Record<ProtestSize, 'default' | 'warning' | 'danger'> = {
  Small: 'default',
  Medium: 'warning',
  Large: 'warning',
  Massive: 'danger',
};

const CAUSE_VARIANTS: Record<ProtestCause, 'warning' | 'info' | 'success' | 'default'> = {
  Economic: 'warning',
  Political: 'info',
  Environmental: 'success',
  Labor: 'default',
};

const now = Date.now();
const h = (hours: number) => now - hours * 3_600_000;
const d = (days: number) => now - days * 86_400_000;

const MOCK: Protest[] = [
  { id: 'p1', location: 'Paris', country: 'France', lat: 48.86, lng: 2.35, size: 'Massive', cause: 'Economic', date: h(4), description: 'Nationwide strikes against pension reform. 1.2M+ protesters across major cities. Transport paralyzed.' },
  { id: 'p2', location: 'Nairobi', country: 'Kenya', lat: -1.29, lng: 36.82, size: 'Large', cause: 'Political', date: h(8), description: 'Anti-government protests over tax hikes and corruption. Tear gas deployed near parliament.' },
  { id: 'p3', location: 'Dhaka', country: 'Bangladesh', lat: 23.81, lng: 90.41, size: 'Massive', cause: 'Political', date: h(12), description: 'Pro-democracy marches demanding free elections. Students lead nationwide mobilization.' },
  { id: 'p4', location: 'Buenos Aires', country: 'Argentina', lat: -34.60, lng: -58.38, size: 'Large', cause: 'Economic', date: h(16), description: 'Protests against austerity measures and public university budget cuts. Plaza de Mayo filled.' },
  { id: 'p5', location: 'Tehran', country: 'Iran', lat: 35.69, lng: 51.39, size: 'Medium', cause: 'Political', date: d(1), description: 'Underground protests reported in multiple cities. Internet throttled. Security forces mobilized.' },
  { id: 'p6', location: 'Jakarta', country: 'Indonesia', lat: -6.21, lng: 106.85, size: 'Large', cause: 'Environmental', date: d(1), description: 'Tens of thousands march against new mining permits in Kalimantan rainforest regions.' },
  { id: 'p7', location: 'Seoul', country: 'South Korea', lat: 37.57, lng: 126.98, size: 'Massive', cause: 'Political', date: d(1.5), description: 'Candlelight vigils continue following political crisis. 500K+ gather in Gwanghwamun Square.' },
  { id: 'p8', location: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.41, size: 'Large', cause: 'Labor', date: d(2), description: 'Transport workers strike. BVG and Deutsche Bahn workers demand 12% wage increase.' },
  { id: 'p9', location: 'Bogota', country: 'Colombia', lat: 4.71, lng: -74.07, size: 'Medium', cause: 'Political', date: d(2), description: 'Peace process supporters rally as government stalls negotiations with ELN rebels.' },
  { id: 'p10', location: 'Tunis', country: 'Tunisia', lat: 36.81, lng: 10.17, size: 'Medium', cause: 'Political', date: d(2.5), description: 'Opposition rallies against democratic backsliding. Journalists and lawyers lead marches.' },
  { id: 'p11', location: 'London', country: 'United Kingdom', lat: 51.51, lng: -0.13, size: 'Large', cause: 'Environmental', date: d(3), description: 'Climate action march from Hyde Park to Parliament. Extinction Rebellion and Just Stop Oil organize.' },
  { id: 'p12', location: 'Santiago', country: 'Chile', lat: -33.45, lng: -70.67, size: 'Medium', cause: 'Economic', date: d(3), description: 'Student protests against rising tuition fees. Barricades erected near Universidad de Chile.' },
  { id: 'p13', location: 'Mumbai', country: 'India', lat: 19.08, lng: 72.88, size: 'Large', cause: 'Labor', date: d(3.5), description: 'Textile workers strike in Maharashtra. 200K workers demand minimum wage increase.' },
  { id: 'p14', location: 'Tbilisi', country: 'Georgia', lat: 41.72, lng: 44.79, size: 'Massive', cause: 'Political', date: d(4), description: 'Pro-EU protests continue. Demonstrators demand new elections and release of political prisoners.' },
  { id: 'p15', location: 'Lagos', country: 'Nigeria', lat: 6.52, lng: 3.38, size: 'Medium', cause: 'Economic', date: d(4.5), description: 'Fuel subsidy removal protests. Markets shuttered as cost of living spikes.' },
  { id: 'p16', location: 'Mexico City', country: 'Mexico', lat: 19.43, lng: -99.13, size: 'Large', cause: 'Political', date: d(5), description: 'Judicial reform opposition. Judges, lawyers, and civil society march down Reforma Avenue.' },
  { id: 'p17', location: 'Athens', country: 'Greece', lat: 37.98, lng: 23.73, size: 'Medium', cause: 'Labor', date: d(5.5), description: 'General strike called by GSEE and ADEDY unions. Public services halted.' },
  { id: 'p18', location: 'Ankara', country: 'Turkey', lat: 39.93, lng: 32.86, size: 'Small', cause: 'Political', date: d(6), description: 'Opposition supporters detained during planned march. Heavy police presence in Kizilay Square.' },
  { id: 'p19', location: 'Lima', country: 'Peru', lat: -12.05, lng: -77.04, size: 'Large', cause: 'Economic', date: d(6.5), description: 'Farmers block Pan-American Highway protesting agricultural import policies.' },
  { id: 'p20', location: 'Bangkok', country: 'Thailand', lat: 13.76, lng: 100.50, size: 'Medium', cause: 'Political', date: d(7), description: 'Youth-led democracy movement rallies at Democracy Monument. Constitutional reform demands.' },
  { id: 'p21', location: 'Brasilia', country: 'Brazil', lat: -15.79, lng: -47.88, size: 'Large', cause: 'Environmental', date: d(8), description: 'Indigenous groups protest Amazon deforestation policies at Esplanada dos Ministerios.' },
];

const FILTER_OPTIONS = ['All', 'Economic', 'Political', 'Environmental', 'Labor'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ProtestTracker: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling<Protest[]>(
    () => Promise.resolve(MOCK),
    manifest.refreshInterval!,
  );

  const items = createMemo(() =>
    [...(data() ?? [])].sort((a, b) => b.date - a.date),
  );

  const { filtered, filter, setFilter } = useFilter<Protest>(
    items,
    (item, f) => item.cause === f,
  );

  useMapLayer(props, () => {
    const list = filtered();
    if (!list.length) return null;
    return [createScatterLayer(`${props.instanceId}-protests`, list, {
      getPosition: (p: Protest) => [p.lng, p.lat],
      getRadius: (p: Protest) => SIZE_RADIUS[p.size],
      getFillColor: () => [249, 115, 22, 190],
      radiusMinPixels: 4,
      radiusMaxPixels: 30,
    })];
  });

  return (
    <AppletShell
      title="Protest Tracker"
      status={loading() ? 'loading' : error() ? 'error' : 'connected'}
      statusText={`${filtered().length} events`}
      toolbar={<FilterBar options={FILTER_OPTIONS} value={filter} onChange={setFilter} />}
    >
      <DataList
        items={filtered}
        loading={loading}
        error={error}
        renderItem={(p: Protest) => (
          <div class="px-3 py-2.5 hover:bg-surface-2 transition-colors">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium">{p.location}, {p.country}</span>
              <div class="flex items-center gap-1.5 shrink-0">
                <Badge text={p.cause} variant={CAUSE_VARIANTS[p.cause]} />
                <Badge text={p.size} variant={SIZE_VARIANTS[p.size]} />
              </div>
            </div>
            <p class="text-xs text-text-secondary mt-1 leading-relaxed">{p.description}</p>
            <span class="text-[10px] text-text-secondary mt-0.5 block">{timeAgo(p.date)}</span>
          </div>
        )}
      />
    </AppletShell>
  );
};

export default ProtestTracker;
