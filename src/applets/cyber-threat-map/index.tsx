// ============================================================================
// CYBER THREAT MAP — Global cyber attack visualization with arc layer
// ============================================================================

import { Component, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, DataList, FilterBar, Badge, StatGrid,
  usePolling, useMapLayer, useFilter,
  createArcLayer, timeAgo,
} from '../../sdk';

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

export const manifest: AppletManifest = {
  id: 'cyber-threat-map',
  name: 'Cyber Threat Map',
  description: 'Real-time cyber attack tracking with source-target arc visualization',
  category: 'intelligence',
  icon: 'shield-off',
  defaultSize: { w: 3, h: 4 },
  minSize: { w: 2, h: 3 },
  resizable: true,
  refreshInterval: 120_000,
  requiresMap: true,
};

// ---------------------------------------------------------------------------
// Types & Mock Data
// ---------------------------------------------------------------------------

type AttackType = 'DDoS' | 'Ransomware' | 'Phishing' | 'APT';
type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

interface CyberAttack {
  id: string;
  sourceCountry: string;
  targetCountry: string;
  srcLat: number;
  srcLng: number;
  tgtLat: number;
  tgtLng: number;
  attackType: AttackType;
  severity: Severity;
  timestamp: number;
  target: string;
}

const now = Date.now();
const m = (mins: number) => now - mins * 60_000;

const ATTACK_VARIANTS: Record<AttackType, 'warning' | 'danger' | 'info' | 'default'> = {
  DDoS: 'warning',
  Ransomware: 'danger',
  Phishing: 'warning',
  APT: 'info',
};

const SEV_VARIANTS: Record<Severity, 'danger' | 'warning' | 'default'> = {
  Critical: 'danger',
  High: 'danger',
  Medium: 'warning',
  Low: 'default',
};

const MOCK: CyberAttack[] = [
  { id: 'cy1', sourceCountry: 'Russia', targetCountry: 'United States', srcLat: 55.76, srcLng: 37.62, tgtLat: 38.91, tgtLng: -77.04, attackType: 'APT', severity: 'Critical', timestamp: m(5), target: 'US Dept of Energy networks' },
  { id: 'cy2', sourceCountry: 'China', targetCountry: 'Taiwan', srcLat: 39.90, srcLng: 116.40, tgtLat: 25.03, tgtLng: 121.57, attackType: 'APT', severity: 'Critical', timestamp: m(12), target: 'TSMC supplier network' },
  { id: 'cy3', sourceCountry: 'North Korea', targetCountry: 'South Korea', srcLat: 39.02, srcLng: 125.75, tgtLat: 37.57, tgtLng: 126.98, attackType: 'Ransomware', severity: 'High', timestamp: m(18), target: 'Korea Aerospace Industries' },
  { id: 'cy4', sourceCountry: 'Iran', targetCountry: 'Israel', srcLat: 35.69, srcLng: 51.39, tgtLat: 32.07, tgtLng: 34.78, attackType: 'DDoS', severity: 'High', timestamp: m(25), target: 'Israeli banking infrastructure' },
  { id: 'cy5', sourceCountry: 'Russia', targetCountry: 'Germany', srcLat: 59.93, srcLng: 30.32, tgtLat: 52.52, tgtLng: 13.41, attackType: 'APT', severity: 'High', timestamp: m(30), target: 'Bundestag email systems' },
  { id: 'cy6', sourceCountry: 'China', targetCountry: 'United States', srcLat: 31.23, srcLng: 121.47, tgtLat: 37.39, tgtLng: -122.08, attackType: 'APT', severity: 'Critical', timestamp: m(35), target: 'Silicon Valley defense contractors' },
  { id: 'cy7', sourceCountry: 'Nigeria', targetCountry: 'United Kingdom', srcLat: 6.52, srcLng: 3.38, tgtLat: 51.51, tgtLng: -0.13, attackType: 'Phishing', severity: 'Medium', timestamp: m(40), target: 'UK financial services firms' },
  { id: 'cy8', sourceCountry: 'Russia', targetCountry: 'Ukraine', srcLat: 55.76, srcLng: 37.62, tgtLat: 50.45, tgtLng: 30.52, attackType: 'DDoS', severity: 'Critical', timestamp: m(45), target: 'Ukrainian power grid SCADA' },
  { id: 'cy9', sourceCountry: 'Brazil', targetCountry: 'Brazil', srcLat: -23.55, srcLng: -46.63, tgtLat: -15.79, tgtLng: -47.88, attackType: 'Ransomware', severity: 'High', timestamp: m(50), target: 'Brasilia municipal govt systems' },
  { id: 'cy10', sourceCountry: 'North Korea', targetCountry: 'Japan', srcLat: 39.02, srcLng: 125.75, tgtLat: 35.68, tgtLng: 139.69, attackType: 'Ransomware', severity: 'High', timestamp: m(55), target: 'Japanese crypto exchange' },
  { id: 'cy11', sourceCountry: 'China', targetCountry: 'India', srcLat: 39.90, srcLng: 116.40, tgtLat: 28.61, tgtLng: 77.21, attackType: 'APT', severity: 'High', timestamp: m(60), target: 'Indian power grid control systems' },
  { id: 'cy12', sourceCountry: 'Iran', targetCountry: 'Saudi Arabia', srcLat: 35.69, srcLng: 51.39, tgtLat: 24.71, tgtLng: 46.68, attackType: 'DDoS', severity: 'Medium', timestamp: m(70), target: 'Saudi Aramco partner networks' },
  { id: 'cy13', sourceCountry: 'Russia', targetCountry: 'Estonia', srcLat: 55.76, srcLng: 37.62, tgtLat: 59.44, tgtLng: 24.75, attackType: 'DDoS', severity: 'High', timestamp: m(80), target: 'Estonian e-governance platform' },
  { id: 'cy14', sourceCountry: 'Vietnam', targetCountry: 'Philippines', srcLat: 21.03, srcLng: 105.85, tgtLat: 14.60, tgtLng: 120.98, attackType: 'Phishing', severity: 'Low', timestamp: m(90), target: 'Philippine maritime agencies' },
  { id: 'cy15', sourceCountry: 'Turkey', targetCountry: 'Greece', srcLat: 41.01, srcLng: 28.98, tgtLat: 37.98, tgtLng: 23.73, attackType: 'DDoS', severity: 'Medium', timestamp: m(100), target: 'Greek defense ministry' },
  { id: 'cy16', sourceCountry: 'China', targetCountry: 'Australia', srcLat: 39.90, srcLng: 116.40, tgtLat: -33.87, tgtLng: 151.21, attackType: 'APT', severity: 'High', timestamp: m(110), target: 'Australian parliament networks' },
  { id: 'cy17', sourceCountry: 'North Korea', targetCountry: 'United States', srcLat: 39.02, srcLng: 125.75, tgtLat: 40.71, tgtLng: -74.01, attackType: 'Ransomware', severity: 'Critical', timestamp: m(120), target: 'NYC hospital network' },
  { id: 'cy18', sourceCountry: 'Russia', targetCountry: 'Poland', srcLat: 55.76, srcLng: 37.62, tgtLat: 52.23, tgtLng: 21.01, attackType: 'Phishing', severity: 'Medium', timestamp: m(130), target: 'Polish railway control systems' },
  { id: 'cy19', sourceCountry: 'Iran', targetCountry: 'United States', srcLat: 35.69, srcLng: 51.39, tgtLat: 38.91, tgtLng: -77.04, attackType: 'Phishing', severity: 'Medium', timestamp: m(140), target: 'US water treatment facilities' },
  { id: 'cy20', sourceCountry: 'China', targetCountry: 'Japan', srcLat: 39.90, srcLng: 116.40, tgtLat: 35.68, tgtLng: 139.69, attackType: 'APT', severity: 'High', timestamp: m(150), target: 'Japanese semiconductor firms' },
  { id: 'cy21', sourceCountry: 'Russia', targetCountry: 'France', srcLat: 55.76, srcLng: 37.62, tgtLat: 48.86, tgtLng: 2.35, attackType: 'Ransomware', severity: 'High', timestamp: m(160), target: 'French hospital network' },
  { id: 'cy22', sourceCountry: 'Pakistan', targetCountry: 'India', srcLat: 33.69, srcLng: 73.04, tgtLat: 28.61, tgtLng: 77.21, attackType: 'APT', severity: 'Medium', timestamp: m(170), target: 'Indian military command systems' },
  { id: 'cy23', sourceCountry: 'North Korea', targetCountry: 'Bangladesh', srcLat: 39.02, srcLng: 125.75, tgtLat: 23.81, tgtLng: 90.41, attackType: 'Ransomware', severity: 'High', timestamp: m(180), target: 'Bangladesh Bank SWIFT network' },
  { id: 'cy24', sourceCountry: 'Russia', targetCountry: 'Lithuania', srcLat: 55.76, srcLng: 37.62, tgtLat: 54.69, tgtLng: 25.28, attackType: 'DDoS', severity: 'Medium', timestamp: m(190), target: 'Lithuanian energy grid' },
  { id: 'cy25', sourceCountry: 'China', targetCountry: 'United Kingdom', srcLat: 31.23, srcLng: 121.47, tgtLat: 51.51, tgtLng: -0.13, attackType: 'APT', severity: 'High', timestamp: m(200), target: 'UK Ministry of Defence contractors' },
  { id: 'cy26', sourceCountry: 'Iran', targetCountry: 'UAE', srcLat: 35.69, srcLng: 51.39, tgtLat: 25.20, tgtLng: 55.27, attackType: 'Phishing', severity: 'Low', timestamp: m(210), target: 'Dubai financial free zone firms' },
  { id: 'cy27', sourceCountry: 'Russia', targetCountry: 'Finland', srcLat: 59.93, srcLng: 30.32, tgtLat: 60.17, tgtLng: 24.94, attackType: 'DDoS', severity: 'Medium', timestamp: m(220), target: 'Finnish parliament website' },
  { id: 'cy28', sourceCountry: 'China', targetCountry: 'Canada', srcLat: 39.90, srcLng: 116.40, tgtLat: 45.42, tgtLng: -75.70, attackType: 'APT', severity: 'Medium', timestamp: m(230), target: 'Canadian research institutions' },
  { id: 'cy29', sourceCountry: 'North Korea', targetCountry: 'Vietnam', srcLat: 39.02, srcLng: 125.75, tgtLat: 21.03, tgtLng: 105.85, attackType: 'Phishing', severity: 'Low', timestamp: m(240), target: 'Vietnamese banking apps' },
  { id: 'cy30', sourceCountry: 'Russia', targetCountry: 'Norway', srcLat: 55.76, srcLng: 37.62, tgtLat: 59.91, tgtLng: 10.75, attackType: 'APT', severity: 'High', timestamp: m(250), target: 'Norwegian oil & gas SCADA systems' },
];

const FILTER_OPTIONS = ['All', 'DDoS', 'Ransomware', 'Phishing', 'APT'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CyberThreatMap: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling<CyberAttack[]>(
    () => Promise.resolve(MOCK),
    manifest.refreshInterval!,
  );

  const items = createMemo(() =>
    [...(data() ?? [])].sort((a, b) => b.timestamp - a.timestamp),
  );

  const { filtered, filter, setFilter } = useFilter<CyberAttack>(
    items,
    (item, f) => item.attackType === f,
  );

  useMapLayer(props, () => {
    const d = filtered();
    if (!d.length) return null;
    return [createArcLayer(`${props.instanceId}-cyber`, d, {
      getSourcePosition: (a: CyberAttack) => [a.srcLng, a.srcLat],
      getTargetPosition: (a: CyberAttack) => [a.tgtLng, a.tgtLat],
      getSourceColor: [220, 38, 38, 180],
      getTargetColor: [59, 130, 246, 180],
      widthMinPixels: 1,
    })];
  });

  const stats = createMemo(() => {
    const d = data() ?? [];
    return [
      { label: 'Total Attacks', value: d.length, color: 'text-red-400' },
      { label: 'Critical', value: d.filter((a) => a.severity === 'Critical').length, color: 'text-red-500' },
      { label: 'APT Campaigns', value: d.filter((a) => a.attackType === 'APT').length, color: 'text-purple-400' },
    ];
  });

  return (
    <AppletShell
      title="Cyber Threat Map"
      status={loading() ? 'loading' : error() ? 'error' : 'connected'}
      statusText={`${filtered().length} attacks`}
      toolbar={
        <div>
          <StatGrid stats={stats()} columns={3} />
          <FilterBar options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
        </div>
      }
    >
      <DataList
        items={filtered}
        loading={loading}
        error={error}
        renderItem={(a: CyberAttack) => (
          <div class="px-3 py-2.5 hover:bg-surface-2 transition-colors">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium truncate">{a.sourceCountry} &rarr; {a.targetCountry}</span>
              <div class="flex items-center gap-1.5 shrink-0">
                <Badge text={a.attackType} variant={ATTACK_VARIANTS[a.attackType]} />
                <Badge text={a.severity} variant={SEV_VARIANTS[a.severity]} />
              </div>
            </div>
            <p class="text-xs text-text-secondary mt-0.5 truncate">{a.target}</p>
            <span class="text-[10px] text-text-secondary">{timeAgo(a.timestamp)}</span>
          </div>
        )}
      />
    </AppletShell>
  );
};

export default CyberThreatMap;
