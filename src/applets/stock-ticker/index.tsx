// ============================================================================
// STOCK TICKER — Real-time equity prices with sparkline charts
// ============================================================================

import { Component, createSignal, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import { AppletShell, DataList, Sparkline, formatNumber } from '../../sdk';

export const manifest: AppletManifest = {
  id: 'stock-ticker',
  name: 'Stock Ticker',
  description: 'Real-time equity prices with change indicators and sparklines',
  category: 'market',
  icon: 'trending-up',
  defaultSize: { w: 3, h: 4 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 15000,
};

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  sparkline: number[];
}

const MOCK_STOCKS: Stock[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: 878.35, change: 4.21, sparkline: [810,825,818,835,842,830,845,852,860,848,855,862,870,865,858,863,872,868,875,880,874,869,876,878] },
  { symbol: 'META', name: 'Meta Platforms', price: 502.18, change: 2.87, sparkline: [475,480,478,485,490,487,492,488,495,491,497,493,498,496,500,497,494,498,501,499,503,500,498,502] },
  { symbol: 'AAPL', name: 'Apple Inc', price: 189.72, change: 1.34, sparkline: [185,186,185.5,187,186,188,187.5,188,189,187.5,188.5,189,188,189.5,189,188.5,189,190,189.5,188.5,189,190,189.5,189.7] },
  { symbol: 'MSFT', name: 'Microsoft Corp', price: 422.86, change: 0.95, sparkline: [415,417,416,418,419,417,420,419,421,420,418,420,421,422,420,421,419,420,422,421,423,422,421,422.9] },
  { symbol: 'GOOGL', name: 'Alphabet Inc', price: 155.23, change: 0.72, sparkline: [153,153.5,154,153.8,154.2,153.5,154,154.5,154.2,154.8,154.5,155,154.3,154.8,155.2,154.9,155.1,154.6,155,155.3,154.8,155.1,155,155.2] },
  { symbol: 'AMZN', name: 'Amazon.com', price: 186.51, change: 0.48, sparkline: [184,184.5,185,184.8,185.2,185.5,185,185.8,186,185.5,185.8,186.2,185.9,186,186.3,185.8,186.1,186.4,186,186.2,186.5,186.3,186.4,186.5] },
  { symbol: 'V', name: 'Visa Inc', price: 281.44, change: 0.35, sparkline: [279,279.5,280,279.8,280.2,280.5,280,280.8,281,280.5,280.8,281.2,280.9,281,281.3,280.8,281.1,281.4,281,281.2,281.5,281.3,281.4,281.4] },
  { symbol: 'WMT', name: 'Walmart Inc', price: 168.92, change: 0.21, sparkline: [167,167.5,168,167.8,168.2,168.5,168,168.3,168.5,168.2,168.4,168.6,168.3,168.5,168.7,168.4,168.6,168.8,168.5,168.7,168.9,168.7,168.8,168.9] },
  { symbol: 'JPM', name: 'JPMorgan Chase', price: 198.63, change: -0.14, sparkline: [200,199.5,200.2,199.8,199.5,200,199.2,199.5,199,199.3,198.8,199.2,199,198.8,199.1,198.7,199,198.6,199,198.8,198.5,198.7,198.6,198.6] },
  { symbol: 'UNH', name: 'UnitedHealth', price: 527.18, change: -0.32, sparkline: [531,530,530.5,529.5,530,529,529.5,528.5,529,528,528.5,527.5,528,527,527.8,527.5,528,527.2,527.5,527,527.5,527.3,527,527.2] },
  { symbol: 'BAC', name: 'Bank of America', price: 37.42, change: -0.53, sparkline: [38,37.8,38.1,37.9,37.7,37.9,37.6,37.8,37.5,37.7,37.4,37.6,37.3,37.5,37.4,37.6,37.3,37.5,37.2,37.4,37.3,37.5,37.4,37.4] },
  { symbol: 'TSLA', name: 'Tesla Inc', price: 172.28, change: -0.85, sparkline: [178,177,176,177.5,176,175,176,174.5,175.5,174,175,173.5,174,173,174,173.5,172.5,173,172,173,172.5,172,172.5,172.3] },
  { symbol: 'DIS', name: 'Walt Disney', price: 112.35, change: -1.02, sparkline: [115,114.5,114,114.5,113.8,114,113.5,113.8,113,113.5,112.8,113,112.5,113,112.8,112.5,113,112.5,112,112.5,112.3,112.5,112.2,112.4] },
  { symbol: 'PFE', name: 'Pfizer Inc', price: 27.84, change: -1.23, sparkline: [28.5,28.4,28.2,28.3,28.1,28.2,28,28.1,27.9,28,27.8,28,27.9,27.8,28,27.8,27.7,27.9,27.7,27.8,27.7,27.9,27.8,27.8] },
  { symbol: 'INTC', name: 'Intel Corp', price: 31.18, change: -1.87, sparkline: [32.5,32.2,32.3,32,32.2,31.8,32,31.7,31.9,31.6,31.8,31.5,31.7,31.4,31.6,31.3,31.5,31.2,31.4,31.1,31.3,31.1,31.2,31.2] },
  { symbol: 'LLY', name: 'Eli Lilly', price: 782.40, change: 3.15, sparkline: [750,755,758,760,755,762,765,760,768,772,770,775,768,772,776,774,778,775,780,776,778,782,780,782] },
  { symbol: 'AVGO', name: 'Broadcom Inc', price: 1342.55, change: 2.41, sparkline: [1290,1300,1295,1310,1305,1315,1310,1320,1315,1325,1320,1330,1325,1335,1328,1332,1338,1335,1340,1336,1342,1338,1340,1342] },
  { symbol: 'XOM', name: 'Exxon Mobil', price: 113.67, change: -0.68, sparkline: [115,114.8,115.2,114.5,114.8,114.2,114.5,114,114.3,113.8,114.1,113.6,114,113.5,113.8,113.4,113.7,113.3,113.6,113.4,113.7,113.5,113.6,113.7] },
  { symbol: 'COST', name: 'Costco', price: 728.90, change: 0.62, sparkline: [722,723,724,723,725,724,726,725,727,726,724,726,727,728,726,727,728,727,729,728,727,729,728,729] },
  { symbol: 'NFLX', name: 'Netflix Inc', price: 628.14, change: 1.78, sparkline: [610,613,611,615,618,615,620,617,622,619,624,621,625,622,626,623,625,627,624,626,628,626,627,628] },
];

const StockTicker: Component<AppletProps> = (props) => {
  const [stocks] = createSignal<Stock[]>(
    [...MOCK_STOCKS].sort((a, b) => b.change - a.change),
  );
  const [loading] = createSignal(false);

  const gainers = createMemo(() => stocks().filter((s) => s.change > 0).length);
  const losers = createMemo(() => stocks().filter((s) => s.change < 0).length);

  return (
    <AppletShell
      title="Stock Ticker"
      status="connected"
      statusText={`${gainers()} up / ${losers()} down`}
    >
      <DataList
        items={stocks}
        loading={loading}
        keyFn={(s) => s.symbol}
        renderItem={(stock) => (
          <div class="flex items-center gap-2 px-3 py-2 hover:bg-surface-2 transition-colors">
            <div class="w-14 shrink-0">
              <div class="text-xs font-bold">{stock.symbol}</div>
              <div class="text-[10px] text-text-secondary truncate">{stock.name}</div>
            </div>
            <div class="flex-1 flex justify-end">
              <Sparkline
                data={stock.sparkline}
                width={64}
                height={20}
                color={stock.change >= 0 ? '#10b981' : '#ef4444'}
              />
            </div>
            <div class="text-right shrink-0 w-20">
              <div class="text-xs font-semibold tabular-nums">
                ${formatNumber(stock.price, { decimals: 2 })}
              </div>
              <div
                class={`text-[10px] font-semibold tabular-nums ${
                  stock.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
              </div>
            </div>
          </div>
        )}
      />
    </AppletShell>
  );
};

export default StockTicker;
