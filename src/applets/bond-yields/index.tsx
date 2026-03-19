// ============================================================================
// BOND YIELDS — Sovereign bond yields with yield curve visualization
// ============================================================================

import { Component, createSignal, For } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import { AppletShell, Sparkline, FilterBar, formatNumber } from '../../sdk';

export const manifest: AppletManifest = {
  id: 'bond-yields',
  name: 'Bond Yields',
  description: 'Sovereign bond yields across maturities with yield curve chart',
  category: 'market',
  icon: 'bar-chart-2',
  defaultSize: { w: 3, h: 4 },
  minSize: { w: 2, h: 3 },
  resizable: true,
  refreshInterval: 120000,
};

interface YieldPoint {
  maturity: string;
  yield: number;
  change: number;
}

interface CountryYields {
  country: string;
  flag: string;
  yields: YieldPoint[];
}

const MOCK_YIELDS: CountryYields[] = [
  {
    country: 'US', flag: 'US',
    yields: [
      { maturity: '1M', yield: 5.52, change: 0.00 },
      { maturity: '3M', yield: 5.48, change: -0.01 },
      { maturity: '6M', yield: 5.38, change: -0.02 },
      { maturity: '1Y', yield: 5.12, change: -0.03 },
      { maturity: '2Y', yield: 4.72, change: -0.04 },
      { maturity: '5Y', yield: 4.28, change: 0.02 },
      { maturity: '10Y', yield: 4.32, change: 0.03 },
      { maturity: '20Y', yield: 4.58, change: 0.04 },
      { maturity: '30Y', yield: 4.48, change: 0.03 },
    ],
  },
  {
    country: 'Germany', flag: 'DE',
    yields: [
      { maturity: '1M', yield: 3.82, change: 0.01 },
      { maturity: '3M', yield: 3.75, change: 0.00 },
      { maturity: '6M', yield: 3.62, change: -0.01 },
      { maturity: '1Y', yield: 3.38, change: -0.02 },
      { maturity: '2Y', yield: 2.92, change: -0.03 },
      { maturity: '5Y', yield: 2.35, change: 0.01 },
      { maturity: '10Y', yield: 2.42, change: 0.02 },
      { maturity: '20Y', yield: 2.58, change: 0.03 },
      { maturity: '30Y', yield: 2.62, change: 0.02 },
    ],
  },
  {
    country: 'Japan', flag: 'JP',
    yields: [
      { maturity: '1M', yield: -0.02, change: 0.00 },
      { maturity: '3M', yield: 0.02, change: 0.01 },
      { maturity: '6M', yield: 0.08, change: 0.01 },
      { maturity: '1Y', yield: 0.12, change: 0.02 },
      { maturity: '2Y', yield: 0.18, change: 0.02 },
      { maturity: '5Y', yield: 0.42, change: 0.03 },
      { maturity: '10Y', yield: 0.72, change: 0.04 },
      { maturity: '20Y', yield: 1.52, change: 0.05 },
      { maturity: '30Y', yield: 1.82, change: 0.04 },
    ],
  },
  {
    country: 'UK', flag: 'GB',
    yields: [
      { maturity: '1M', yield: 5.18, change: -0.01 },
      { maturity: '3M', yield: 5.12, change: -0.01 },
      { maturity: '6M', yield: 4.98, change: -0.02 },
      { maturity: '1Y', yield: 4.72, change: -0.02 },
      { maturity: '2Y', yield: 4.38, change: -0.03 },
      { maturity: '5Y', yield: 3.92, change: 0.01 },
      { maturity: '10Y', yield: 4.08, change: 0.02 },
      { maturity: '20Y', yield: 4.52, change: 0.03 },
      { maturity: '30Y', yield: 4.62, change: 0.02 },
    ],
  },
];

const COUNTRY_OPTIONS = ['US', 'Germany', 'Japan', 'UK'];

const BondYields: Component<AppletProps> = (props) => {
  const [selected, setSelected] = createSignal('US');

  const current = () => MOCK_YIELDS.find((c) => c.country === selected())!;
  const curveData = () => current().yields.map((y) => y.yield);

  return (
    <AppletShell
      title="Bond Yields"
      status="connected"
      toolbar={
        <FilterBar options={COUNTRY_OPTIONS} value={selected} onChange={setSelected} />
      }
    >
      {/* Yield curve sparkline */}
      <div class="px-3 py-2 border-b border-border">
        <div class="text-[10px] text-text-secondary uppercase tracking-wide mb-1">
          {selected()} Yield Curve
        </div>
        <Sparkline data={curveData()} width={260} height={48} color="#6366f1" />
        <div class="flex justify-between text-[9px] text-text-secondary mt-0.5">
          <span>1M</span><span>2Y</span><span>10Y</span><span>30Y</span>
        </div>
      </div>

      {/* Yields table */}
      <div class="overflow-y-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="text-[10px] text-text-secondary uppercase tracking-wide border-b border-border">
              <th class="text-left px-3 py-1.5 font-medium">Maturity</th>
              <th class="text-right px-3 py-1.5 font-medium">Yield</th>
              <th class="text-right px-3 py-1.5 font-medium">Chg</th>
            </tr>
          </thead>
          <tbody>
            <For each={current().yields}>
              {(point) => (
                <tr class="border-b border-border/50 hover:bg-surface-2 transition-colors">
                  <td class="px-3 py-1.5 font-semibold">{point.maturity}</td>
                  <td class="px-3 py-1.5 text-right tabular-nums">{point.yield.toFixed(2)}%</td>
                  <td class={`px-3 py-1.5 text-right tabular-nums ${point.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {point.change >= 0 ? '+' : ''}{point.change.toFixed(2)}
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </AppletShell>
  );
};

export default BondYields;
