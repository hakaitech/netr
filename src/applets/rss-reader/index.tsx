// ============================================================================
// RSS READER — Custom RSS feed reader with mock fallback
// ============================================================================

import { Component, createSignal, For, Show } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import { AppletShell, useAppletState, usePolling, timeAgo } from '../../sdk';

export const manifest: AppletManifest = {
  id: 'rss-reader',
  name: 'RSS Reader',
  description: 'Custom RSS feed reader',
  category: 'utility',
  icon: 'rss',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 300_000,
};

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description?: string;
}

const MOCK_ITEMS: FeedItem[] = [
  { title: 'Global Supply Chain Disruptions Ease as Shipping Routes Normalize', link: '#', pubDate: new Date(Date.now() - 3600_000).toISOString(), source: 'Reuters' },
  { title: 'Central Banks Signal Coordinated Rate Strategy for Q2', link: '#', pubDate: new Date(Date.now() - 7200_000).toISOString(), source: 'Bloomberg' },
  { title: 'Pacific Rim Nations Announce Joint Climate Initiative', link: '#', pubDate: new Date(Date.now() - 14400_000).toISOString(), source: 'AP News' },
  { title: 'Breakthrough in Quantum Computing Achieves Error Correction Milestone', link: '#', pubDate: new Date(Date.now() - 28800_000).toISOString(), source: 'Nature' },
  { title: 'Satellite Imagery Reveals Arctic Ice Extent Below 10-Year Average', link: '#', pubDate: new Date(Date.now() - 43200_000).toISOString(), source: 'NASA' },
  { title: 'International Space Station Module Receives Upgrade', link: '#', pubDate: new Date(Date.now() - 54000_000).toISOString(), source: 'ESA' },
  { title: 'Global Renewable Energy Capacity Surpasses 4 TW Mark', link: '#', pubDate: new Date(Date.now() - 64800_000).toISOString(), source: 'IEA' },
  { title: 'Deep Sea Mining Regulations Under Review by UN Committee', link: '#', pubDate: new Date(Date.now() - 86400_000).toISOString(), source: 'BBC' },
];

const RSSReader: Component<AppletProps> = (props) => {
  const [state, setState] = useAppletState(props, { feedUrl: '' });
  const [useMock, setUseMock] = createSignal(true);

  const { data, loading, error, refresh } = usePolling<FeedItem[]>(
    async () => {
      const url = state().feedUrl.trim();
      if (!url) { setUseMock(true); return MOCK_ITEMS; }
      try {
        const result = await props.services.http.get<{ items: FeedItem[] }>(
          `/api/rss?url=${encodeURIComponent(url)}`,
          { cacheTtl: 300_000 },
        );
        setUseMock(false);
        return result.items;
      } catch {
        setUseMock(true);
        return MOCK_ITEMS;
      }
    },
    300_000,
  );

  const items = () => data() ?? [];

  return (
    <AppletShell
      title="RSS Reader"
      status={loading() ? 'loading' : error() ? 'error' : 'connected'}
      statusText={useMock() ? 'Demo data' : 'Live'}
    >
      <div class="px-3 py-2 border-b border-border shrink-0 flex gap-2">
        <input
          type="text"
          value={state().feedUrl}
          onInput={(e) => setState({ feedUrl: e.currentTarget.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') refresh(); }}
          placeholder="RSS feed URL (leave empty for demo)..."
          class="flex-1 bg-surface-2 text-text-primary text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-text-secondary"
        />
        <button onClick={refresh} class="px-2 py-1 rounded text-xs bg-surface-2 text-text-secondary hover:bg-surface-3 transition-colors">
          Fetch
        </button>
      </div>

      <Show when={loading()}>
        <div class="flex items-center justify-center h-20 text-text-secondary text-sm">Loading feed...</div>
      </Show>

      <Show when={!loading() && items().length === 0}>
        <div class="flex items-center justify-center h-20 text-text-secondary text-sm">No articles</div>
      </Show>

      <ul class="divide-y divide-border">
        <For each={items()}>
          {(item) => (
            <li>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                class="block px-3 py-2.5 hover:bg-surface-2 transition-colors"
              >
                <p class="text-sm leading-snug">{item.title}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-accent font-medium">{item.source}</span>
                  <span class="text-xs text-text-secondary">{timeAgo(new Date(item.pubDate).getTime())}</span>
                </div>
              </a>
            </li>
          )}
        </For>
      </ul>
    </AppletShell>
  );
};

export default RSSReader;
