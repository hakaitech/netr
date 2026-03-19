// ============================================================================
// THREAT ALERTS — Regional threat level assessments with map visualization
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
  id: 'threat-alerts',
  name: 'Threat Alerts',
  description: 'Regional security threat level assessments and advisories',
  category: 'intelligence',
  icon: 'shield-alert',
  defaultSize: { w: 3, h: 4 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 300_000,
  requiresMap: true,
};

// ---------------------------------------------------------------------------
// Types & Mock Data
// ---------------------------------------------------------------------------

type ThreatLevel = 'Critical' | 'High' | 'Elevated' | 'Low';

interface ThreatAlert {
  id: string;
  region: string;
  threatLevel: ThreatLevel;
  description: string;
  lastUpdated: number;
  lat: number;
  lng: number;
}

const now = Date.now();
const h = (hours: number) => now - hours * 3_600_000;

const LEVEL_COLORS: Record<ThreatLevel, [number, number, number, number]> = {
  Critical: [239, 68, 68, 220],
  High: [249, 115, 22, 200],
  Elevated: [234, 179, 8, 180],
  Low: [34, 197, 94, 160],
};

const LEVEL_VARIANTS: Record<ThreatLevel, 'danger' | 'warning' | 'success' | 'default'> = {
  Critical: 'danger',
  High: 'warning',
  Elevated: 'warning',
  Low: 'success',
};

const LEVEL_BG: Record<ThreatLevel, string> = {
  Critical: 'bg-red-500/20 border-l-2 border-red-500',
  High: 'bg-orange-500/10 border-l-2 border-orange-500',
  Elevated: 'bg-amber-500/10 border-l-2 border-amber-500',
  Low: '',
};

const MOCK: ThreatAlert[] = [
  { id: 't1', region: 'Eastern Ukraine', threatLevel: 'Critical', description: 'Active high-intensity combat zone. Missile and drone strikes on civilian infrastructure. Avoid all travel.', lastUpdated: h(1), lat: 48.57, lng: 37.80 },
  { id: 't2', region: 'Gaza Strip', threatLevel: 'Critical', description: 'Active military operations. Severe humanitarian crisis. All borders effectively closed.', lastUpdated: h(2), lat: 31.35, lng: 34.31 },
  { id: 't3', region: 'Khartoum, Sudan', threatLevel: 'Critical', description: 'Heavy urban combat between SAF and RSF. Widespread shelling and airstrikes. No evacuation routes.', lastUpdated: h(3), lat: 15.50, lng: 32.56 },
  { id: 't4', region: 'Red Sea Shipping Lanes', threatLevel: 'Critical', description: 'Houthi anti-ship missile and drone attacks on commercial vessels. Re-route via Cape of Good Hope advised.', lastUpdated: h(4), lat: 13.50, lng: 42.50 },
  { id: 't5', region: 'North Kivu, DR Congo', threatLevel: 'High', description: 'M23 offensive ongoing. Displacement of 500K+ civilians. Armed clashes near Goma city limits.', lastUpdated: h(5), lat: -1.68, lng: 29.22 },
  { id: 't6', region: 'Sahel Region (Mali/Burkina)', threatLevel: 'High', description: 'Jihadist insurgency expanding. Multiple attacks on military posts and villages weekly.', lastUpdated: h(6), lat: 14.0, lng: -2.0 },
  { id: 't7', region: 'Haiti - Port-au-Prince', threatLevel: 'High', description: 'Gang control of 80%+ of capital. Kidnapping epidemic. Airport intermittently closed.', lastUpdated: h(8), lat: 18.54, lng: -72.34 },
  { id: 't8', region: 'Myanmar - Sagaing/Chin', threatLevel: 'High', description: 'Military junta airstrikes on resistance-held areas. Widespread atrocities reported.', lastUpdated: h(10), lat: 21.88, lng: 95.97 },
  { id: 't9', region: 'Somalia - South Central', threatLevel: 'High', description: 'Al-Shabaab controls rural areas. Regular IED and complex attacks on government forces.', lastUpdated: h(12), lat: 2.05, lng: 45.32 },
  { id: 't10', region: 'Strait of Hormuz', threatLevel: 'Elevated', description: 'IRGC naval exercises and tanker harassment incidents. Heightened military presence.', lastUpdated: h(14), lat: 26.57, lng: 56.25 },
  { id: 't11', region: 'Taiwan Strait', threatLevel: 'Elevated', description: 'Increased PLA military drills and gray-zone incursions. Elevated tensions following arms sales.', lastUpdated: h(16), lat: 24.50, lng: 119.50 },
  { id: 't12', region: 'Lebanon - South', threatLevel: 'Elevated', description: 'Cross-border exchanges between Hezbollah and IDF. Civilian evacuations in border villages.', lastUpdated: h(18), lat: 33.27, lng: 35.20 },
  { id: 't13', region: 'Pakistan - Balochistan', threatLevel: 'Elevated', description: 'BLA separatist attacks on military convoys and Chinese-funded infrastructure projects.', lastUpdated: h(20), lat: 28.90, lng: 66.50 },
  { id: 't14', region: 'South China Sea - Spratlys', threatLevel: 'Elevated', description: 'Chinese Coast Guard water cannon incidents against Philippine vessels. Risk of miscalculation.', lastUpdated: h(22), lat: 10.00, lng: 114.00 },
  { id: 't15', region: 'Baltic States', threatLevel: 'Elevated', description: 'Hybrid warfare indicators: cyberattacks, GPS jamming, border provocations from Russian territory.', lastUpdated: h(24), lat: 56.95, lng: 24.11 },
  { id: 't16', region: 'Colombia - Cauca Dept', threatLevel: 'Low', description: 'Sporadic clashes between FARC dissidents and security forces. Rural areas affected.', lastUpdated: h(30), lat: 2.44, lng: -76.61 },
  { id: 't17', region: 'Japan - Okinawa', threatLevel: 'Low', description: 'Routine Chinese military activity around Senkaku Islands. Self-Defense Forces monitoring.', lastUpdated: h(36), lat: 26.34, lng: 127.77 },
];

const FILTER_OPTIONS = ['All', 'Critical', 'High', 'Elevated', 'Low'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ThreatAlerts: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling<ThreatAlert[]>(
    () => Promise.resolve(MOCK),
    manifest.refreshInterval!,
  );

  const items = createMemo(() => {
    const order: Record<ThreatLevel, number> = { Critical: 0, High: 1, Elevated: 2, Low: 3 };
    return [...(data() ?? [])].sort((a, b) => order[a.threatLevel] - order[b.threatLevel]);
  });

  const { filtered, filter, setFilter } = useFilter<ThreatAlert>(
    items,
    (item, f) => item.threatLevel === f,
  );

  useMapLayer(props, () => {
    const d = filtered();
    if (!d.length) return null;
    return [createScatterLayer(`${props.instanceId}-threats`, d, {
      getPosition: (t: ThreatAlert) => [t.lng, t.lat],
      getRadius: 80000,
      getFillColor: (t: ThreatAlert) => LEVEL_COLORS[t.threatLevel],
      radiusMinPixels: 6,
      radiusMaxPixels: 20,
    })];
  });

  return (
    <AppletShell
      title="Threat Alerts"
      status={loading() ? 'loading' : error() ? 'error' : 'connected'}
      statusText={`${filtered().length} regions`}
      toolbar={<FilterBar options={FILTER_OPTIONS} value={filter} onChange={setFilter} />}
    >
      <DataList
        items={filtered}
        loading={loading}
        error={error}
        renderItem={(t: ThreatAlert) => (
          <div class={`px-3 py-2.5 hover:bg-surface-2 transition-colors ${LEVEL_BG[t.threatLevel]}`}>
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium">{t.region}</span>
              <Badge text={t.threatLevel.toUpperCase()} variant={LEVEL_VARIANTS[t.threatLevel]} />
            </div>
            <p class="text-xs text-text-secondary mt-1 leading-relaxed">{t.description}</p>
            <span class="text-[10px] text-text-secondary mt-1 block">{timeAgo(t.lastUpdated)}</span>
          </div>
        )}
      />
    </AppletShell>
  );
};

export default ThreatAlerts;
