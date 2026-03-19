// ============================================================================
// LIVE NEWS — Aggregated real-time news from multiple sources
// ============================================================================

import {
  Component,
  createSignal,
  onMount,
  onCleanup,
  For,
  Show,
} from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import type { NewsItem } from '../../core/types';

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

export const manifest: AppletManifest = {
  id: 'live-news',
  name: 'Live News',
  description: 'Aggregated real-time news from multiple sources',
  category: 'intelligence',
  icon: 'newspaper',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 120000,
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_URL = '/api/news';
const POLL_MS = 120_000;

const CATEGORIES = ['All', 'Geopolitics', 'Markets', 'Tech', 'Environment'] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

// ---------------------------------------------------------------------------
// Mock fallback data
// ---------------------------------------------------------------------------

function generateMockNews(): NewsItem[] {
  const now = Date.now();
  const items: Array<Omit<NewsItem, 'id'>> = [
    { title: 'NATO allies agree on expanded defense spending targets amid rising tensions', description: 'Defense ministers from 31 member nations signed a joint declaration committing to increased military budgets over the next decade.', source: 'Reuters', category: 'Geopolitics', url: 'https://reuters.com', publishedAt: now - 300_000 },
    { title: 'Magnitude 7.1 earthquake strikes off the coast of Chile', description: 'A powerful earthquake has been reported near Valparaiso. Tsunami warnings issued for coastal regions.', source: 'AP News', category: 'Environment', url: 'https://apnews.com', publishedAt: now - 900_000, imageUrl: 'https://placehold.co/400x200/1a1a2e/e4e4ed?text=Earthquake' },
    { title: 'Federal Reserve signals potential rate pause as inflation cools', description: 'Markets rallied after the Fed Chair indicated the central bank may hold rates steady at the next meeting.', source: 'Bloomberg', category: 'Markets', url: 'https://bloomberg.com', publishedAt: now - 1_800_000 },
    { title: 'OpenAI announces GPT-5 with real-time multimodal capabilities', description: 'The latest model demonstrates significant advances in reasoning, code generation, and live audio/video understanding.', source: 'TechCrunch', category: 'Tech', url: 'https://techcrunch.com', publishedAt: now - 2_400_000 },
    { title: 'South China Sea tensions escalate as naval vessels converge near disputed reef', description: 'Multiple nations have deployed patrol boats near the Scarborough Shoal following a diplomatic breakdown.', source: 'BBC', category: 'Geopolitics', url: 'https://bbc.com', publishedAt: now - 3_600_000 },
    { title: 'European carbon credit prices hit all-time high', description: 'The EU Emissions Trading System saw record-breaking prices as new regulations take effect across industrial sectors.', source: 'Financial Times', category: 'Markets', url: 'https://ft.com', publishedAt: now - 4_200_000 },
    { title: 'Hurricane Maria strengthens to Category 4 in the Atlantic', description: 'Forecasters warn the storm could make landfall along the southeastern US coast within 72 hours.', source: 'CNN', category: 'Environment', url: 'https://cnn.com', publishedAt: now - 5_400_000 },
    { title: 'SpaceX successfully launches Starship on sixth integrated test flight', description: 'The vehicle achieved orbital insertion and both stages were recovered, marking a historic milestone.', source: 'Ars Technica', category: 'Tech', url: 'https://arstechnica.com', publishedAt: now - 7_200_000 },
    { title: 'UN Security Council holds emergency session on Sudan humanitarian crisis', description: 'Aid agencies report widespread famine as conflict between military factions intensifies in Darfur.', source: 'Al Jazeera', category: 'Geopolitics', url: 'https://aljazeera.com', publishedAt: now - 9_000_000 },
    { title: 'Global semiconductor shortage easing as new fabs come online in Arizona', description: 'TSMC and Intel report improved output from recently completed fabrication plants, signaling relief for the auto and electronics industries.', source: 'WSJ', category: 'Tech', url: 'https://wsj.com', publishedAt: now - 10_800_000 },
    { title: 'Crude oil surges past $95 as OPEC+ extends production cuts', description: 'Energy markets react sharply to the cartel decision to maintain tight supply through Q2.', source: 'Bloomberg', category: 'Markets', url: 'https://bloomberg.com', publishedAt: now - 12_600_000 },
    { title: 'Record-breaking wildfires consume 500,000 acres across northern Canada', description: 'Smoke plumes are affecting air quality in major US cities as far south as Chicago and New York.', source: 'CBC', category: 'Environment', url: 'https://cbc.ca', publishedAt: now - 14_400_000 },
    { title: 'India and Japan sign landmark defense cooperation pact', description: 'The agreement allows joint military exercises and intelligence sharing in the Indo-Pacific region.', source: 'Nikkei', category: 'Geopolitics', url: 'https://nikkei.com', publishedAt: now - 16_200_000 },
    { title: 'Apple unveils AI-powered health monitoring features for next-gen devices', description: 'New sensors and on-device machine learning models aim to detect early signs of cardiac and respiratory conditions.', source: 'The Verge', category: 'Tech', url: 'https://theverge.com', publishedAt: now - 18_000_000 },
    { title: 'Amazon river levels drop to historic lows amid prolonged drought', description: 'Communities in the Brazilian interior face water shortages and disrupted shipping routes.', source: 'Guardian', category: 'Environment', url: 'https://theguardian.com', publishedAt: now - 21_600_000 },
  ];

  return items.map((item, i) => ({
    ...item,
    id: `mock-${i}-${Date.now()}`,
  }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function categoryBadgeColor(cat: string): string {
  switch (cat.toLowerCase()) {
    case 'geopolitics':
      return 'bg-red-900/60 text-red-300';
    case 'markets':
      return 'bg-emerald-900/60 text-emerald-300';
    case 'tech':
      return 'bg-blue-900/60 text-blue-300';
    case 'environment':
      return 'bg-amber-900/60 text-amber-300';
    default:
      return 'bg-surface-3 text-text-secondary';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LiveNews: Component<AppletProps> = (props) => {
  const [news, setNews] = createSignal<NewsItem[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [activeFilter, setActiveFilter] = createSignal<CategoryFilter>('All');

  const filtered = () => {
    const cat = activeFilter();
    if (cat === 'All') return news();
    return news().filter(
      (n) => n.category.toLowerCase() === cat.toLowerCase(),
    );
  };

  // -- Fetch ----------------------------------------------------------------

  async function fetchNews() {
    try {
      const data = await props.services.http.get<{ items: NewsItem[] }>(
        API_URL,
        { cacheTtl: 30_000 },
      );
      const items = data.items ?? [];
      if (items.length > 0) {
        items.sort((a, b) => b.publishedAt - a.publishedAt);
        setNews(items);
        props.services.eventBus.emit('news:update', items);
      } else {
        throw new Error('empty');
      }
    } catch {
      // Fallback to mock data
      const mock = generateMockNews();
      setNews(mock);
      props.services.eventBus.emit('news:update', mock);
    } finally {
      setLoading(false);
    }
  }

  // -- Lifecycle ------------------------------------------------------------

  let interval: ReturnType<typeof setInterval>;

  onMount(() => {
    fetchNews();
    interval = setInterval(fetchNews, POLL_MS);
  });

  onCleanup(() => {
    clearInterval(interval);
  });

  // -- Render ---------------------------------------------------------------

  return (
    <div class="flex flex-col h-full bg-surface-1 text-text-primary">
      {/* Header */}
      <div class="px-3 py-2 border-b border-border shrink-0">
        <h2 class="text-sm font-semibold tracking-wide uppercase mb-2">
          Live News
        </h2>
        {/* Category filter pills */}
        <div class="flex gap-1.5 flex-wrap">
          <For each={CATEGORIES as unknown as CategoryFilter[]}>
            {(cat) => (
              <button
                class={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                  activeFilter() === cat
                    ? 'bg-accent text-white'
                    : 'bg-surface-2 text-text-secondary hover:bg-surface-3'
                }`}
                onClick={() => setActiveFilter(cat)}
              >
                {cat}
              </button>
            )}
          </For>
        </div>
      </div>

      {/* Body */}
      <div class="flex-1 overflow-y-auto min-h-0">
        <Show when={loading()}>
          <div class="flex items-center justify-center h-full text-text-secondary text-sm">
            Loading news...
          </div>
        </Show>

        <Show when={!loading()}>
          <ul class="divide-y divide-border">
            <For each={filtered()}>
              {(item) => (
                <li>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex gap-3 px-3 py-2.5 hover:bg-surface-2 transition-colors"
                  >
                    {/* Thumbnail */}
                    <Show when={item.imageUrl}>
                      <img
                        src={item.imageUrl}
                        alt=""
                        class="shrink-0 w-16 h-16 rounded object-cover bg-surface-3"
                        loading="lazy"
                      />
                    </Show>

                    <div class="min-w-0 flex-1">
                      {/* Source + time row */}
                      <div class="flex items-center gap-2 mb-0.5">
                        <span
                          class={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${categoryBadgeColor(item.category)}`}
                        >
                          {item.source}
                        </span>
                        <span class="text-[10px] text-text-secondary">
                          {timeAgo(item.publishedAt)}
                        </span>
                      </div>

                      {/* Title */}
                      <p class="text-sm font-medium leading-snug line-clamp-2">
                        {item.title}
                      </p>
                    </div>
                  </a>
                </li>
              )}
            </For>
          </ul>

          <Show when={filtered().length === 0}>
            <div class="flex items-center justify-center h-32 text-text-secondary text-sm">
              No articles in this category
            </div>
          </Show>
        </Show>
      </div>
    </div>
  );
};

export default LiveNews;
