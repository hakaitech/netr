// ============================================================================
// FOREX RATES — Major currency pairs with base currency selector
// ============================================================================

import { Component, createSignal, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import { AppletShell, DataList, Sparkline, FilterBar, formatNumber } from '../../sdk';

export const manifest: AppletManifest = {
  id: 'forex-rates',
  name: 'Forex Rates',
  description: 'Major currency exchange rates with base currency selector',
  category: 'market',
  icon: 'dollar-sign',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 30000,
};

interface ForexPair {
  pair: string;
  rate: number;
  change: number;
  sparkline: number[];
}

// Rates expressed as 1 USD = X
const BASE_RATES: Record<string, number> = {
  EUR: 0.9218, GBP: 0.7892, JPY: 151.42, CHF: 0.8834, CAD: 1.3572,
  AUD: 1.5318, NZD: 1.6742, SEK: 10.4215, NOK: 10.6830, DKK: 6.8745,
  SGD: 1.3412, HKD: 7.8265,
};

const PAIR_SPARKLINES: Record<string, number[]> = {
  EUR: [0.9180,0.9195,0.9205,0.9190,0.9215,0.9225,0.9210,0.9200,0.9220,0.9230,0.9215,0.9210,0.9225,0.9218],
  GBP: [0.7860,0.7870,0.7880,0.7865,0.7885,0.7895,0.7880,0.7875,0.7890,0.7900,0.7888,0.7885,0.7895,0.7892],
  JPY: [150.80,150.95,151.10,150.85,151.20,151.35,151.15,151.00,151.25,151.40,151.30,151.20,151.35,151.42],
  CHF: [0.8800,0.8810,0.8820,0.8805,0.8825,0.8835,0.8820,0.8815,0.8830,0.8840,0.8828,0.8825,0.8835,0.8834],
  CAD: [1.3540,1.3550,1.3560,1.3545,1.3565,1.3575,1.3560,1.3555,1.3570,1.3580,1.3568,1.3565,1.3575,1.3572],
  AUD: [1.5280,1.5290,1.5300,1.5285,1.5310,1.5320,1.5305,1.5295,1.5315,1.5325,1.5312,1.5310,1.5320,1.5318],
  NZD: [1.6700,1.6710,1.6720,1.6705,1.6730,1.6740,1.6725,1.6715,1.6735,1.6745,1.6732,1.6730,1.6742,1.6742],
  SEK: [10.38,10.39,10.40,10.38,10.41,10.42,10.40,10.39,10.41,10.42,10.41,10.40,10.42,10.42],
  NOK: [10.64,10.65,10.66,10.64,10.67,10.68,10.66,10.65,10.67,10.69,10.68,10.67,10.68,10.68],
  DKK: [6.84,6.85,6.86,6.84,6.87,6.88,6.86,6.85,6.87,6.88,6.87,6.86,6.87,6.87],
  SGD: [1.3380,1.3390,1.3400,1.3385,1.3405,1.3415,1.3400,1.3395,1.3410,1.3420,1.3408,1.3405,1.3415,1.3412],
  HKD: [7.8230,7.8240,7.8250,7.8235,7.8255,7.8265,7.8250,7.8245,7.8260,7.8270,7.8258,7.8255,7.8268,7.8265],
};

const PAIR_CHANGES: Record<string, number> = {
  EUR: -0.12, GBP: 0.08, JPY: 0.25, CHF: -0.06, CAD: 0.15,
  AUD: -0.22, NZD: -0.18, SEK: 0.32, NOK: 0.28, DKK: -0.11,
  SGD: 0.05, HKD: 0.01,
};

const BASE_OPTIONS = ['USD', 'EUR', 'GBP'];

const ForexRates: Component<AppletProps> = (props) => {
  const [base, setBase] = createSignal('USD');
  const [loading] = createSignal(false);

  const pairs = createMemo((): ForexPair[] => {
    const b = base();
    const currencies = Object.keys(BASE_RATES).filter((c) => c !== b);
    if (b === 'USD') {
      return currencies.map((c) => ({
        pair: `USD/${c}`,
        rate: BASE_RATES[c],
        change: PAIR_CHANGES[c],
        sparkline: PAIR_SPARKLINES[c],
      }));
    }
    // Convert through USD: if base is EUR, rate for GBP = BASE_RATES[GBP] / BASE_RATES[EUR]
    const baseToUsd = BASE_RATES[b]; // how many base per 1 USD => 1 base = 1/baseToUsd USD
    return currencies.map((c) => {
      const crossRate = BASE_RATES[c] / baseToUsd;
      const sparkData = PAIR_SPARKLINES[c].map((v, i) => v / PAIR_SPARKLINES[b][i]);
      return {
        pair: `${b}/${c}`,
        rate: crossRate,
        change: PAIR_CHANGES[c] - PAIR_CHANGES[b],
        sparkline: sparkData,
      };
    });
  });

  return (
    <AppletShell
      title="Forex Rates"
      status="connected"
      headerRight={
        <div class="flex gap-1">
          {BASE_OPTIONS.map((opt) => (
            <button
              class={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                base() === opt ? 'bg-accent text-white' : 'bg-surface-2 text-text-secondary hover:bg-surface-3'
              }`}
              onClick={() => setBase(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      }
    >
      <DataList
        items={pairs}
        loading={loading}
        keyFn={(p) => p.pair}
        renderItem={(pair) => (
          <div class="flex items-center gap-2 px-3 py-2 hover:bg-surface-2 transition-colors">
            <div class="w-16 shrink-0">
              <div class="text-xs font-bold">{pair.pair}</div>
            </div>
            <div class="flex-1 flex justify-end">
              <Sparkline
                data={pair.sparkline}
                width={60}
                height={18}
                color={pair.change >= 0 ? '#10b981' : '#ef4444'}
              />
            </div>
            <div class="text-right shrink-0 w-24">
              <div class="text-xs font-semibold tabular-nums">
                {pair.rate >= 100 ? formatNumber(pair.rate, { decimals: 2 }) : pair.rate.toFixed(4)}
              </div>
              <div class={`text-[10px] font-semibold tabular-nums ${pair.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {pair.change >= 0 ? '+' : ''}{pair.change.toFixed(2)}%
              </div>
            </div>
          </div>
        )}
      />
    </AppletShell>
  );
};

export default ForexRates;
