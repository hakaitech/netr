// ============================================================================
// ELECTION MONITOR — Upcoming, ongoing, and completed elections worldwide
// ============================================================================

import { Component, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, DataList, FilterBar, Badge,
  usePolling, useMapLayer, useFilter,
  createScatterLayer,
} from '../../sdk';

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

export const manifest: AppletManifest = {
  id: 'election-monitor',
  name: 'Election Monitor',
  description: 'Tracking upcoming, ongoing, and recently completed elections globally',
  category: 'intelligence',
  icon: 'vote',
  defaultSize: { w: 3, h: 4 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 600_000,
  requiresMap: true,
};

// ---------------------------------------------------------------------------
// Types & Mock Data
// ---------------------------------------------------------------------------

type ElectionType = 'Presidential' | 'Parliamentary' | 'Referendum' | 'Municipal';
type ElectionStatus = 'Upcoming' | 'Ongoing' | 'Completed';

interface Election {
  id: string;
  country: string;
  type: ElectionType;
  date: string;
  status: ElectionStatus;
  description: string;
  lat: number;
  lng: number;
}

const STATUS_COLORS: Record<ElectionStatus, [number, number, number, number]> = {
  Upcoming: [59, 130, 246, 200],
  Ongoing: [234, 179, 8, 220],
  Completed: [34, 197, 94, 180],
};

const STATUS_VARIANTS: Record<ElectionStatus, 'info' | 'warning' | 'success'> = {
  Upcoming: 'info',
  Ongoing: 'warning',
  Completed: 'success',
};

const TYPE_VARIANTS: Record<ElectionType, 'danger' | 'info' | 'success' | 'default'> = {
  Presidential: 'danger',
  Parliamentary: 'info',
  Referendum: 'success',
  Municipal: 'default',
};

const MOCK: Election[] = [
  { id: 'e1', country: 'Germany', type: 'Parliamentary', date: '2025-02-23', status: 'Completed', description: 'Federal election. CDU/CSU wins plurality; coalition negotiations underway.', lat: 52.52, lng: 13.41 },
  { id: 'e2', country: 'Australia', type: 'Parliamentary', date: '2025-05-17', status: 'Completed', description: 'Federal election. Labor retains majority government under PM Albanese.', lat: -33.87, lng: 151.21 },
  { id: 'e3', country: 'South Korea', type: 'Presidential', date: '2025-06-03', status: 'Completed', description: 'Snap presidential election following constitutional crisis and impeachment.', lat: 37.57, lng: 126.98 },
  { id: 'e4', country: 'Bolivia', type: 'Presidential', date: '2025-08-17', status: 'Completed', description: 'General election amid economic crisis. MAS party retains presidency.', lat: -16.50, lng: -68.15 },
  { id: 'e5', country: 'Chile', type: 'Presidential', date: '2025-11-16', status: 'Completed', description: 'Presidential election first round. Runoff expected in December.', lat: -33.45, lng: -70.67 },
  { id: 'e6', country: 'Ivory Coast', type: 'Presidential', date: '2025-10-25', status: 'Completed', description: 'Presidential election. Incumbent party claims victory amid opposition boycott.', lat: 5.36, lng: -4.01 },
  { id: 'e7', country: 'Norway', type: 'Parliamentary', date: '2025-09-08', status: 'Completed', description: 'Storting elections. Conservative bloc wins majority.', lat: 59.91, lng: 10.75 },
  { id: 'e8', country: 'Philippines', type: 'Parliamentary', date: '2025-05-12', status: 'Completed', description: 'Midterm elections for Senate and House of Representatives.', lat: 14.60, lng: 120.98 },
  { id: 'e9', country: 'Canada', type: 'Parliamentary', date: '2025-04-28', status: 'Completed', description: 'Federal election. Liberal Party wins minority government under new leader.', lat: 45.42, lng: -75.70 },
  { id: 'e10', country: 'DR Congo', type: 'Municipal', date: '2026-03-25', status: 'Upcoming', description: 'First local elections in 20+ years. Logistics challenges across vast territory.', lat: -4.32, lng: 15.31 },
  { id: 'e11', country: 'India', type: 'Municipal', date: '2026-04-15', status: 'Upcoming', description: 'Delhi municipal corporation elections. BJP vs AAP contest.', lat: 28.61, lng: 77.21 },
  { id: 'e12', country: 'Colombia', type: 'Parliamentary', date: '2026-03-08', status: 'Ongoing', description: 'Congressional elections underway. Voting extended due to security concerns in rural areas.', lat: 4.71, lng: -74.07 },
  { id: 'e13', country: 'Mexico', type: 'Municipal', date: '2026-06-07', status: 'Upcoming', description: 'Gubernatorial and state elections across 15 states.', lat: 19.43, lng: -99.13 },
  { id: 'e14', country: 'Brazil', type: 'Municipal', date: '2026-10-04', status: 'Upcoming', description: 'Nationwide mayoral and city council elections in 5,500+ municipalities.', lat: -15.79, lng: -47.88 },
  { id: 'e15', country: 'Japan', type: 'Parliamentary', date: '2026-07-26', status: 'Upcoming', description: 'House of Councillors election. LDP facing opposition coalition challenge.', lat: 35.68, lng: 139.69 },
  { id: 'e16', country: 'Ecuador', type: 'Presidential', date: '2026-02-28', status: 'Completed', description: 'Presidential runoff. Reform candidate claims narrow victory.', lat: -0.18, lng: -78.47 },
  { id: 'e17', country: 'Czech Republic', type: 'Parliamentary', date: '2025-10-10', status: 'Completed', description: 'Chamber of Deputies election. Center-right SPOLU coalition returns to power.', lat: 50.08, lng: 14.44 },
];

const FILTER_OPTIONS = ['All', 'Upcoming', 'Ongoing', 'Completed'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ElectionMonitor: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling<Election[]>(
    () => Promise.resolve(MOCK),
    manifest.refreshInterval!,
  );

  const items = createMemo(() =>
    [...(data() ?? [])].sort((a, b) => {
      const order: Record<ElectionStatus, number> = { Ongoing: 0, Upcoming: 1, Completed: 2 };
      const od = order[a.status] - order[b.status];
      if (od !== 0) return od;
      return a.date.localeCompare(b.date);
    }),
  );

  const { filtered, filter, setFilter } = useFilter<Election>(
    items,
    (item, f) => item.status === f,
  );

  useMapLayer(props, () => {
    const d = filtered();
    if (!d.length) return null;
    return [createScatterLayer(`${props.instanceId}-elections`, d, {
      getPosition: (e: Election) => [e.lng, e.lat],
      getRadius: 60000,
      getFillColor: (e: Election) => STATUS_COLORS[e.status],
      radiusMinPixels: 5,
      radiusMaxPixels: 15,
    })];
  });

  return (
    <AppletShell
      title="Election Monitor"
      status={loading() ? 'loading' : error() ? 'error' : 'connected'}
      statusText={`${filtered().length} elections`}
      toolbar={<FilterBar options={FILTER_OPTIONS} value={filter} onChange={setFilter} />}
    >
      <DataList
        items={filtered}
        loading={loading}
        error={error}
        renderItem={(e: Election) => (
          <div class="px-3 py-2.5 hover:bg-surface-2 transition-colors">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium">{e.country}</span>
              <div class="flex items-center gap-1.5 shrink-0">
                <Badge text={e.type} variant={TYPE_VARIANTS[e.type]} />
                <Badge text={e.status} variant={STATUS_VARIANTS[e.status]} />
              </div>
            </div>
            <div class="text-xs text-text-secondary mt-0.5">{e.date}</div>
            <p class="text-xs text-text-secondary mt-0.5 leading-relaxed">{e.description}</p>
          </div>
        )}
      />
    </AppletShell>
  );
};

export default ElectionMonitor;
