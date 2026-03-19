// ============================================================================
// FLOOD ALERTS — River flood warning system with gauge levels
// ============================================================================

import { Component, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, DataList, StatGrid, Badge, usePolling, useMapLayer,
  createScatterLayer, formatNumber,
} from '../../sdk';

export const manifest: AppletManifest = {
  id: 'flood-alerts',
  name: 'Flood Alerts',
  description: 'River flood warnings with gauge levels and severity data',
  category: 'environment',
  icon: 'waves',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 120_000,
  requiresMap: true,
};

type FloodSeverity = 'minor' | 'moderate' | 'major' | 'record';

interface FloodAlert {
  id: string;
  river: string;
  location: string;
  country: string;
  lat: number;
  lng: number;
  severity: FloodSeverity;
  gaugeLevelM: number;
  floodStageM: number;
  forecastPeak: string;
  communitiesAffected: number;
}

const SEV_VARIANT: Record<FloodSeverity, 'info' | 'warning' | 'danger'> = {
  minor: 'info', moderate: 'warning', major: 'danger', record: 'danger',
};

const SEV_COLOR: Record<FloodSeverity, [number, number, number, number]> = {
  minor: [96, 165, 250, 200], moderate: [245, 158, 11, 220],
  major: [239, 68, 68, 230], record: [168, 85, 247, 240],
};

const MOCK: FloodAlert[] = [
  { id: 'f1', river: 'Mississippi', location: 'Memphis, TN', country: 'US', lat: 35.15, lng: -90.05, severity: 'major', gaugeLevelM: 12.8, floodStageM: 10.4, forecastPeak: '2026-03-20', communitiesAffected: 45000 },
  { id: 'f2', river: 'Rhine', location: 'Cologne', country: 'DE', lat: 50.94, lng: 6.96, severity: 'moderate', gaugeLevelM: 8.2, floodStageM: 7.5, forecastPeak: '2026-03-19', communitiesAffected: 28000 },
  { id: 'f3', river: 'Ganges', location: 'Patna, Bihar', country: 'IN', lat: 25.61, lng: 85.14, severity: 'major', gaugeLevelM: 9.5, floodStageM: 7.8, forecastPeak: '2026-03-21', communitiesAffected: 120000 },
  { id: 'f4', river: 'Danube', location: 'Budapest', country: 'HU', lat: 47.50, lng: 19.04, severity: 'minor', gaugeLevelM: 6.1, floodStageM: 5.8, forecastPeak: '2026-03-18', communitiesAffected: 8500 },
  { id: 'f5', river: 'Yangtze', location: 'Wuhan', country: 'CN', lat: 30.59, lng: 114.31, severity: 'moderate', gaugeLevelM: 11.3, floodStageM: 10.0, forecastPeak: '2026-03-22', communitiesAffected: 65000 },
  { id: 'f6', river: 'Amazon', location: 'Manaus', country: 'BR', lat: -3.12, lng: -60.02, severity: 'record', gaugeLevelM: 29.9, floodStageM: 27.5, forecastPeak: '2026-03-25', communitiesAffected: 180000 },
  { id: 'f7', river: 'Mekong', location: 'Phnom Penh', country: 'KH', lat: 11.56, lng: 104.92, severity: 'minor', gaugeLevelM: 7.0, floodStageM: 6.5, forecastPeak: '2026-03-19', communitiesAffected: 15000 },
  { id: 'f8', river: 'Niger', location: 'Niamey', country: 'NE', lat: 13.51, lng: 2.11, severity: 'moderate', gaugeLevelM: 5.8, floodStageM: 5.2, forecastPeak: '2026-03-20', communitiesAffected: 32000 },
  { id: 'f9', river: 'Seine', location: 'Paris', country: 'FR', lat: 48.86, lng: 2.35, severity: 'minor', gaugeLevelM: 4.5, floodStageM: 4.2, forecastPeak: '2026-03-18', communitiesAffected: 5200 },
  { id: 'f10', river: 'Indus', location: 'Sukkur, Sindh', country: 'PK', lat: 27.70, lng: 68.86, severity: 'major', gaugeLevelM: 8.9, floodStageM: 7.0, forecastPeak: '2026-03-23', communitiesAffected: 95000 },
  { id: 'f11', river: 'Po', location: 'Ferrara', country: 'IT', lat: 44.84, lng: 11.62, severity: 'moderate', gaugeLevelM: 6.4, floodStageM: 5.8, forecastPeak: '2026-03-19', communitiesAffected: 18000 },
  { id: 'f12', river: 'Murray', location: 'Echuca', country: 'AU', lat: -36.13, lng: 144.75, severity: 'minor', gaugeLevelM: 5.0, floodStageM: 4.7, forecastPeak: '2026-03-18', communitiesAffected: 4800 },
];

function fetchMock(): Promise<FloodAlert[]> {
  return new Promise((r) => setTimeout(() => r(MOCK), 200));
}

const FloodAlerts: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling<FloodAlert[]>(fetchMock, 120_000);
  const items = createMemo(() => {
    const order: Record<FloodSeverity, number> = { record: 0, major: 1, moderate: 2, minor: 3 };
    return (data() ?? []).sort((a, b) => order[a.severity] - order[b.severity]);
  });

  const stats = createMemo(() => {
    const d = items();
    const total = d.reduce((s, a) => s + a.communitiesAffected, 0);
    const majorPlus = d.filter((a) => a.severity === 'major' || a.severity === 'record').length;
    return [
      { label: 'Active Alerts', value: d.length },
      { label: 'People at Risk', value: formatNumber(total, { compact: true }) },
      { label: 'Major/Record', value: majorPlus, color: 'text-red-400' },
    ];
  });

  useMapLayer(props, () => {
    const d = items();
    if (!d.length) return null;
    return [createScatterLayer(`${props.instanceId}-floods`, d, {
      getPosition: (a: FloodAlert) => [a.lng, a.lat],
      getRadius: (a: FloodAlert) => Math.max(a.gaugeLevelM - a.floodStageM, 0.2) * 30000,
      getFillColor: (a: FloodAlert) => SEV_COLOR[a.severity],
      radiusMinPixels: 5,
      radiusMaxPixels: 30,
    })];
  });

  return (
    <AppletShell
      title="Flood Alerts"
      status={loading() ? 'loading' : error() ? 'error' : 'connected'}
      statusText={`${items().length} alerts`}
      toolbar={<StatGrid stats={stats()} columns={3} />}
    >
      <DataList
        items={items}
        loading={loading}
        error={error}
        renderItem={(alert) => {
          const aboveStage = (alert.gaugeLevelM - alert.floodStageM).toFixed(1);
          return (
            <div class="flex items-start gap-3 px-3 py-2 hover:bg-surface-2 transition-colors">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium truncate">{alert.river}</p>
                  <Badge text={alert.severity} variant={SEV_VARIANT[alert.severity]} />
                </div>
                <p class="text-xs text-text-secondary mt-0.5">
                  {alert.location}, {alert.country}
                </p>
                <p class="text-xs text-text-secondary">
                  Gauge: {alert.gaugeLevelM}m ({aboveStage}m above flood stage) &middot; Peak: {alert.forecastPeak}
                </p>
                <p class="text-[10px] text-text-secondary">
                  {formatNumber(alert.communitiesAffected)} people affected
                </p>
              </div>
            </div>
          );
        }}
      />
    </AppletShell>
  );
};

export default FloodAlerts;
