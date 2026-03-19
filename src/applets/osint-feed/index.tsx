// ============================================================================
// OSINT FEED — Open source intelligence aggregator from social & RSS sources
// ============================================================================

import { Component, createMemo, For } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, DataList, FilterBar, Badge,
  usePolling, useFilter, timeAgo,
} from '../../sdk';

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

export const manifest: AppletManifest = {
  id: 'osint-feed',
  name: 'OSINT Feed',
  description: 'Open source intelligence from social media, Telegram, and RSS feeds',
  category: 'intelligence',
  icon: 'radio',
  defaultSize: { w: 3, h: 4 },
  minSize: { w: 2, h: 3 },
  resizable: true,
  refreshInterval: 120_000,
  requiresMap: false,
};

// ---------------------------------------------------------------------------
// Types & Mock Data
// ---------------------------------------------------------------------------

interface OsintItem {
  id: string;
  source: 'Twitter/X' | 'Telegram' | 'Reddit' | 'RSS';
  content: string;
  timestamp: number;
  relevance: 'high' | 'medium' | 'low';
  tags: string[];
}

const now = Date.now();
const h = (hours: number) => now - hours * 3_600_000;
const m = (mins: number) => now - mins * 60_000;

const MOCK: OsintItem[] = [
  { id: 'o1', source: 'Telegram', content: 'Ukrainian forces report successful drone strikes on ammunition depot near Mariupol. Secondary explosions observed.', timestamp: m(12), relevance: 'high', tags: ['Ukraine', 'military'] },
  { id: 'o2', source: 'Twitter/X', content: 'BREAKING: Large explosion reported near Kharkiv energy infrastructure. Power outages across eastern districts.', timestamp: m(25), relevance: 'high', tags: ['Ukraine', 'infrastructure'] },
  { id: 'o3', source: 'RSS', content: 'UN Security Council emergency session called to discuss escalating Sudan crisis. Draft resolution circulating.', timestamp: m(45), relevance: 'high', tags: ['Sudan', 'UN', 'diplomacy'] },
  { id: 'o4', source: 'Reddit', content: 'Analysis: Satellite imagery shows new construction at Chinese military facility on Mischief Reef, Spratly Islands.', timestamp: h(1), relevance: 'medium', tags: ['China', 'South China Sea', 'satellite'] },
  { id: 'o5', source: 'Telegram', content: 'Wagner-linked forces reportedly moving toward gold mining region in central Mali. Local sources confirm vehicle convoys.', timestamp: h(1.5), relevance: 'high', tags: ['Mali', 'Wagner', 'Africa'] },
  { id: 'o6', source: 'Twitter/X', content: 'Iranian IRGC Navy conducting exercises near Strait of Hormuz. At least 12 fast-attack craft observed by maritime trackers.', timestamp: h(2), relevance: 'medium', tags: ['Iran', 'maritime', 'Hormuz'] },
  { id: 'o7', source: 'RSS', content: 'North Korea conducts test of new solid-fuel ICBM variant. Japanese PM calls emergency NSC meeting.', timestamp: h(2.5), relevance: 'high', tags: ['DPRK', 'missiles', 'Japan'] },
  { id: 'o8', source: 'Telegram', content: 'RSF forces besieging El Fasher intensify shelling. Hospital reports over 40 civilian casualties in last 24 hours.', timestamp: h(3), relevance: 'high', tags: ['Sudan', 'humanitarian'] },
  { id: 'o9', source: 'Reddit', content: 'OSINT analysis of AIS data reveals 14 tankers conducting ship-to-ship transfers off Malaysian coast. Suspected sanctions evasion.', timestamp: h(4), relevance: 'medium', tags: ['maritime', 'sanctions', 'oil'] },
  { id: 'o10', source: 'Twitter/X', content: 'Sources: EU foreign ministers to discuss new sanctions package targeting Russian LNG sector at Monday summit.', timestamp: h(4.5), relevance: 'medium', tags: ['EU', 'sanctions', 'energy'] },
  { id: 'o11', source: 'Telegram', content: 'Myanmar resistance forces claim capture of strategic border crossing at Myawaddy. Thai border security elevated.', timestamp: h(5), relevance: 'high', tags: ['Myanmar', 'conflict', 'Thailand'] },
  { id: 'o12', source: 'RSS', content: 'Interpol Red Notice issued for former Venezuelan intelligence chief linked to drug trafficking network.', timestamp: h(6), relevance: 'medium', tags: ['Venezuela', 'crime', 'Interpol'] },
  { id: 'o13', source: 'Twitter/X', content: 'Chinese Coast Guard vessels enter Scarborough Shoal area for third consecutive day. Philippine vessels maintaining position.', timestamp: h(7), relevance: 'medium', tags: ['China', 'Philippines', 'maritime'] },
  { id: 'o14', source: 'Reddit', content: 'Open source analysis: New radar installation detected at Ethiopian air force base via commercial satellite. Possible S-300 system.', timestamp: h(8), relevance: 'low', tags: ['Ethiopia', 'military', 'satellite'] },
  { id: 'o15', source: 'Telegram', content: 'Houthi naval forces claim targeting of commercial vessel in Red Sea with anti-ship ballistic missile. No confirmation.', timestamp: h(9), relevance: 'high', tags: ['Yemen', 'Houthis', 'maritime'] },
  { id: 'o16', source: 'RSS', content: 'NATO intelligence assessment warns of increased Russian submarine activity in North Atlantic. GIUK gap patrols intensified.', timestamp: h(10), relevance: 'medium', tags: ['NATO', 'Russia', 'submarine'] },
  { id: 'o17', source: 'Twitter/X', content: 'Major cyberattack hits Baltic state government systems. Attribution points to GRU-linked Sandworm APT group.', timestamp: h(11), relevance: 'high', tags: ['cyber', 'Russia', 'Baltics'] },
  { id: 'o18', source: 'Reddit', content: 'Compilation: Timeline of all confirmed North Korean weapons shipments to Russia since Sept 2023. 47 verified transfers.', timestamp: h(13), relevance: 'medium', tags: ['DPRK', 'Russia', 'arms'] },
  { id: 'o19', source: 'Telegram', content: 'Colombian military launches operation against FARC dissident camps in Cauca department. Helicopter gunships deployed.', timestamp: h(14), relevance: 'low', tags: ['Colombia', 'FARC', 'military'] },
  { id: 'o20', source: 'RSS', content: 'IAEA report: Iran uranium enrichment now at 83.7%, approaching weapons-grade threshold of 90%.', timestamp: h(16), relevance: 'high', tags: ['Iran', 'nuclear', 'IAEA'] },
];

const SOURCE_VARIANTS: Record<string, 'info' | 'warning' | 'success' | 'default'> = {
  'Twitter/X': 'info',
  Telegram: 'info',
  Reddit: 'warning',
  RSS: 'success',
};

const RELEVANCE_VARIANTS: Record<string, 'danger' | 'warning' | 'default'> = {
  high: 'danger',
  medium: 'warning',
  low: 'default',
};

const FILTER_OPTIONS = ['All', 'Twitter/X', 'Telegram', 'Reddit', 'RSS'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const OsintFeed: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling<OsintItem[]>(
    () => Promise.resolve(MOCK),
    manifest.refreshInterval!,
  );

  const items = createMemo(() => {
    const d = data() ?? [];
    return [...d].sort((a, b) => b.timestamp - a.timestamp);
  });

  const { filtered, filter, setFilter } = useFilter<OsintItem>(
    items,
    (item, f) => item.source === f,
  );

  return (
    <AppletShell
      title="OSINT Feed"
      status={loading() ? 'loading' : error() ? 'error' : 'connected'}
      statusText={`${filtered().length} items`}
      toolbar={<FilterBar options={FILTER_OPTIONS} value={filter} onChange={setFilter} />}
    >
      <DataList
        items={filtered}
        loading={loading}
        error={error}
        renderItem={(item: OsintItem) => (
          <div class="px-3 py-2.5 hover:bg-surface-2 transition-colors">
            <div class="flex items-center justify-between gap-2 mb-1">
              <div class="flex items-center gap-1.5">
                <Badge text={item.source} variant={SOURCE_VARIANTS[item.source] ?? 'default'} />
                <Badge text={item.relevance.toUpperCase()} variant={RELEVANCE_VARIANTS[item.relevance] ?? 'default'} />
              </div>
              <span class="text-[10px] text-text-secondary shrink-0">{timeAgo(item.timestamp)}</span>
            </div>
            <p class="text-sm leading-snug">{item.content}</p>
            <div class="flex gap-1 mt-1 flex-wrap">
              <For each={item.tags}>
                {(t) => <span class="text-[10px] text-text-secondary bg-surface-2 rounded px-1.5 py-0.5">#{t}</span>}
              </For>
            </div>
          </div>
        )}
      />
    </AppletShell>
  );
};

export default OsintFeed;
