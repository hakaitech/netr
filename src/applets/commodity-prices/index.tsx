// ============================================================================
// COMMODITY PRICES — Major commodities with price trends
// ============================================================================

import { Component, createSignal } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import { AppletShell, DataList, Sparkline, formatNumber } from '../../sdk';

export const manifest: AppletManifest = {
  id: 'commodity-prices',
  name: 'Commodity Prices',
  description: 'Major commodities including energy, metals, and agriculture',
  category: 'market',
  icon: 'gem',
  defaultSize: { w: 3, h: 4 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 60000,
};

interface Commodity {
  name: string;
  price: number;
  unit: string;
  change: number;
  sparkline7d: number[];
}

const MOCK_COMMODITIES: Commodity[] = [
  { name: 'Crude Oil WTI', price: 78.42, unit: '$/bbl', change: 1.85, sparkline7d: [75.20,75.80,76.50,76.10,77.00,77.40,76.80,77.60,78.10,77.50,78.00,78.30,77.80,78.42] },
  { name: 'Brent Crude', price: 82.18, unit: '$/bbl', change: 1.62, sparkline7d: [79.50,80.00,80.60,80.20,81.00,81.40,80.90,81.50,82.00,81.40,81.80,82.10,81.70,82.18] },
  { name: 'Gold', price: 2078.50, unit: '$/oz', change: 0.42, sparkline7d: [2062,2065,2068,2064,2070,2072,2068,2074,2076,2071,2075,2077,2074,2078] },
  { name: 'Silver', price: 23.14, unit: '$/oz', change: -0.35, sparkline7d: [23.40,23.35,23.30,23.28,23.32,23.25,23.22,23.28,23.20,23.18,23.22,23.16,23.15,23.14] },
  { name: 'Natural Gas', price: 2.68, unit: '$/MMBtu', change: -2.14, sparkline7d: [2.82,2.80,2.78,2.76,2.74,2.76,2.72,2.74,2.70,2.72,2.68,2.70,2.66,2.68] },
  { name: 'Copper', price: 3.94, unit: '$/lb', change: 0.78, sparkline7d: [3.85,3.86,3.88,3.87,3.90,3.91,3.89,3.92,3.93,3.91,3.93,3.94,3.92,3.94] },
  { name: 'Platinum', price: 912.40, unit: '$/oz', change: -0.52, sparkline7d: [920,918,916,918,914,916,912,915,910,914,912,913,911,912] },
  { name: 'Wheat', price: 5.82, unit: '$/bu', change: -1.28, sparkline7d: [6.02,5.98,5.96,5.94,5.92,5.95,5.90,5.92,5.88,5.90,5.86,5.85,5.83,5.82] },
  { name: 'Corn', price: 4.36, unit: '$/bu', change: 0.32, sparkline7d: [4.30,4.31,4.32,4.30,4.33,4.34,4.32,4.35,4.34,4.33,4.35,4.36,4.35,4.36] },
  { name: 'Coffee', price: 185.60, unit: 'c/lb', change: 2.45, sparkline7d: [178,179,180,179,182,183,181,184,185,183,184,186,184,186] },
  { name: 'Sugar', price: 22.84, unit: 'c/lb', change: -0.68, sparkline7d: [23.20,23.15,23.10,23.12,23.05,23.08,23.00,23.05,22.95,22.98,22.90,22.88,22.85,22.84] },
  { name: 'Cotton', price: 82.35, unit: 'c/lb', change: 0.15, sparkline7d: [81.80,81.90,82.00,81.85,82.10,82.15,82.00,82.20,82.25,82.10,82.25,82.30,82.25,82.35] },
];

const CommodityPrices: Component<AppletProps> = (props) => {
  const [commodities] = createSignal<Commodity[]>(MOCK_COMMODITIES);
  const [loading] = createSignal(false);

  return (
    <AppletShell title="Commodities" status="connected" statusText="12 instruments">
      <DataList
        items={commodities}
        loading={loading}
        keyFn={(c) => c.name}
        renderItem={(item) => (
          <div class="flex items-center gap-2 px-3 py-2 hover:bg-surface-2 transition-colors">
            <div class="min-w-0 flex-1">
              <div class="text-xs font-semibold">{item.name}</div>
              <div class="text-[10px] text-text-secondary">{item.unit}</div>
            </div>
            <Sparkline
              data={item.sparkline7d}
              width={56}
              height={20}
              color={item.change >= 0 ? '#10b981' : '#ef4444'}
            />
            <div class="text-right shrink-0 w-20">
              <div class="text-xs font-semibold tabular-nums">
                {item.price >= 100 ? formatNumber(item.price, { decimals: 2 }) : item.price.toFixed(2)}
              </div>
              <div class={`text-[10px] font-semibold tabular-nums ${item.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
              </div>
            </div>
          </div>
        )}
      />
    </AppletShell>
  );
};

export default CommodityPrices;
