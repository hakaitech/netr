// ============================================================================
// APPLET CATALOG — Slide-in panel showing available applets by category
// ============================================================================

import { createSignal, For, Show } from 'solid-js';
import type { AppletCategory, AppletManifest } from '../core/applet.contract';
import {
  Map,
  Activity,
  Newspaper,
  Plane,
  Ship,
  Globe,
  Search,
  Shield,
  Radio,
  Zap,
  TrendingUp,
  Bitcoin,
  DollarSign,
  Calendar,
  Grid3x3,
  Landmark,
  Truck,
  Anchor,
  Satellite,
  Construction,
  Target,
  Cloud,
  Flame,
  Wind,
  Thermometer,
  Droplets,
  Waves,
  Clock,
  FileText,
  Code,
  Timer,
  Monitor,
  Crosshair,
  Bookmark,
  Ruler,
  Compass,
  Users,
  Vote,
  Megaphone,
  WifiOff,
  Plug,
  Route,
  AlertTriangle,
  BarChart3,
  GitBranch,
  Download,
  StickyNote,
  Link,
  Rss,
  Github,
  MessageSquare,
  X,
  Plus,
  type LucideProps,
} from 'lucide-solid';
import type { Component, JSX } from 'solid-js';

// ---------------------------------------------------------------------------
// Icon resolver
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, Component<LucideProps>> = {
  map: Map,
  activity: Activity,
  newspaper: Newspaper,
  plane: Plane,
  ship: Ship,
  globe: Globe,
  search: Search,
  shield: Shield,
  radio: Radio,
  zap: Zap,
  'trending-up': TrendingUp,
  bitcoin: Bitcoin,
  'dollar-sign': DollarSign,
  calendar: Calendar,
  grid3x3: Grid3x3,
  landmark: Landmark,
  truck: Truck,
  anchor: Anchor,
  satellite: Satellite,
  construction: Construction,
  target: Target,
  cloud: Cloud,
  flame: Flame,
  wind: Wind,
  thermometer: Thermometer,
  droplets: Droplets,
  waves: Waves,
  clock: Clock,
  'file-text': FileText,
  code: Code,
  timer: Timer,
  monitor: Monitor,
  crosshair: Crosshair,
  bookmark: Bookmark,
  ruler: Ruler,
  compass: Compass,
  users: Users,
  vote: Vote,
  megaphone: Megaphone,
  'wifi-off': WifiOff,
  plug: Plug,
  route: Route,
  'alert-triangle': AlertTriangle,
  'bar-chart-3': BarChart3,
  'git-branch': GitBranch,
  download: Download,
  'sticky-note': StickyNote,
  link: Link,
  rss: Rss,
  github: Github,
  'message-square': MessageSquare,
};

function AppletIcon(props: { icon: string; class?: string }): JSX.Element {
  const Icon = ICON_MAP[props.icon];
  if (!Icon) return <span class={props.class}>?</span>;
  return <Icon size={20} class={props.class} />;
}

// ---------------------------------------------------------------------------
// Category metadata
// ---------------------------------------------------------------------------

const CATEGORIES: { value: AppletCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'geo', label: 'Geospatial' },
  { value: 'intelligence', label: 'Intelligence' },
  { value: 'market', label: 'Markets' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'environment', label: 'Environment' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'utility', label: 'Utility' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AppletCatalogProps {
  open: boolean;
  onClose: () => void;
  onAddApplet: (appletId: string) => void;
  /** All available applet manifests from the registry */
  manifests: AppletManifest[];
}

export default function AppletCatalog(props: AppletCatalogProps) {
  const [filter, setFilter] = createSignal<AppletCategory | 'all'>('all');

  const filtered = () => {
    const f = filter();
    if (f === 'all') return props.manifests;
    return props.manifests.filter((a) => a.category === f);
  };

  return (
    <div
      class="absolute inset-y-0 right-0 z-30 flex transition-transform duration-300 ease-in-out"
      classList={{
        'translate-x-0': props.open,
        'translate-x-full': !props.open,
      }}
    >
      {/* Backdrop */}
      <Show when={props.open}>
        <div
          class="absolute inset-0 -left-[100vw] bg-black/30"
          onClick={props.onClose}
        />
      </Show>

      {/* Panel */}
      <aside class="relative w-80 h-full flex flex-col bg-surface-1 border-l border-border shadow-xl">
        {/* Header */}
        <div class="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 class="text-sm font-semibold tracking-wide uppercase text-text-secondary">
            Applet Catalog ({props.manifests.length})
          </h2>
          <button
            class="p-1 rounded hover:bg-surface-2 text-text-secondary hover:text-text-primary transition-colors"
            onClick={props.onClose}
            aria-label="Close catalog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Category filters */}
        <div class="flex flex-wrap gap-1.5 px-4 py-3 border-b border-border">
          <For each={CATEGORIES}>
            {(cat) => (
              <button
                class="px-2.5 py-1 text-xs rounded-full border transition-colors"
                classList={{
                  'bg-accent text-white border-accent': filter() === cat.value,
                  'bg-surface-2 text-text-secondary border-border hover:border-accent/50':
                    filter() !== cat.value,
                }}
                onClick={() => setFilter(cat.value)}
              >
                {cat.label}
              </button>
            )}
          </For>
        </div>

        {/* Applet list */}
        <div class="flex-1 overflow-y-auto p-3 space-y-2">
          <For each={filtered()}>
            {(applet) => (
              <div class="rounded-lg border border-border bg-surface-2 p-3 hover:border-accent/40 transition-colors">
                <div class="flex items-start gap-3">
                  <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-3 text-accent">
                    <AppletIcon icon={applet.icon} />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2">
                      <h3 class="text-sm font-medium text-text-primary truncate">
                        {applet.name}
                      </h3>
                      <button
                        class="flex items-center gap-1 shrink-0 rounded-md bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent hover:bg-accent/25 transition-colors"
                        onClick={() => props.onAddApplet(applet.id)}
                        aria-label={`Add ${applet.name}`}
                      >
                        <Plus size={12} />
                        Add
                      </button>
                    </div>
                    <p class="mt-0.5 text-xs leading-relaxed text-text-secondary">
                      {applet.description}
                    </p>
                    <div class="mt-1.5 flex items-center gap-1.5">
                      <span class="inline-block rounded-full bg-surface-3 px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-secondary">
                        {applet.category}
                      </span>
                      <Show when={applet.external}>
                        <span class="inline-block rounded-full bg-warning/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-warning">
                          External
                        </span>
                      </Show>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </aside>
    </div>
  );
}
