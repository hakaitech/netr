// ============================================================================
// MARKET HEATMAP — S&P 500 sector performance as colored grid
// ============================================================================

import { Component, For } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import { AppletShell, formatNumber } from '../../sdk';

export const manifest: AppletManifest = {
  id: 'market-heatmap',
  name: 'Market Heatmap',
  description: 'S&P 500 sector performance visualized as a heatmap grid',
  category: 'market',
  icon: 'grid',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 60000,
};

interface Sector {
  name: string;
  change: number;
  weight: number; // market cap weight as percentage
}

const MOCK_SECTORS: Sector[] = [
  { name: 'Technology', change: 1.82, weight: 29.5 },
  { name: 'Healthcare', change: -0.45, weight: 13.2 },
  { name: 'Financials', change: 0.68, weight: 12.8 },
  { name: 'Consumer Disc.', change: 1.15, weight: 10.5 },
  { name: 'Communication', change: 0.92, weight: 8.8 },
  { name: 'Industrials', change: 0.35, weight: 8.5 },
  { name: 'Consumer Staples', change: -0.28, weight: 6.2 },
  { name: 'Energy', change: -1.12, weight: 4.1 },
  { name: 'Utilities', change: -0.62, weight: 2.5 },
  { name: 'Real Estate', change: -0.85, weight: 2.4 },
  { name: 'Materials', change: 0.18, weight: 1.5 },
];

function heatColor(change: number): string {
  if (change >= 1.5) return 'bg-emerald-600';
  if (change >= 0.5) return 'bg-emerald-700/80';
  if (change >= 0) return 'bg-emerald-900/60';
  if (change >= -0.5) return 'bg-red-900/60';
  if (change >= -1.0) return 'bg-red-700/80';
  return 'bg-red-600';
}

const MarketHeatmap: Component<AppletProps> = (props) => {
  // Sort by weight descending for visual hierarchy
  const sectors = [...MOCK_SECTORS].sort((a, b) => b.weight - a.weight);
  const totalUp = sectors.filter((s) => s.change > 0).length;

  return (
    <AppletShell
      title="Market Heatmap"
      status="connected"
      statusText={`${totalUp}/${sectors.length} sectors up`}
    >
      <div class="p-2 grid grid-cols-3 gap-1 h-full auto-rows-fr">
        <For each={sectors}>
          {(sector) => (
            <div
              class={`${heatColor(sector.change)} rounded flex flex-col items-center justify-center p-1 text-center transition-colors`}
              style={{ 'grid-column': sector.weight > 20 ? 'span 2' : undefined }}
            >
              <div class="text-[10px] font-semibold text-white/90 leading-tight truncate w-full">
                {sector.name}
              </div>
              <div class={`text-sm font-bold tabular-nums ${sector.change >= 0 ? 'text-white' : 'text-white'}`}>
                {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(2)}%
              </div>
              <div class="text-[9px] text-white/50">{sector.weight}% wt</div>
            </div>
          )}
        </For>
      </div>
    </AppletShell>
  );
};

export default MarketHeatmap;
