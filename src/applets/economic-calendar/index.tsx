// ============================================================================
// ECONOMIC CALENDAR — Upcoming macroeconomic events with importance filtering
// ============================================================================

import { Component, createSignal, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import { AppletShell, DataList, FilterBar, Badge, useFilter } from '../../sdk';

export const manifest: AppletManifest = {
  id: 'economic-calendar',
  name: 'Economic Calendar',
  description: 'Upcoming macro events: CPI, FOMC, GDP, NFP, PMI and more',
  category: 'market',
  icon: 'calendar',
  defaultSize: { w: 3, h: 4 },
  minSize: { w: 2, h: 3 },
  resizable: true,
  refreshInterval: 300000,
};

interface EconEvent {
  id: string;
  date: string;
  time: string;
  event: string;
  country: string;
  importance: 'high' | 'medium' | 'low';
  previous: string;
  forecast: string;
  actual: string;
}

const MOCK_EVENTS: EconEvent[] = [
  { id: 'e1', date: '2026-03-18', time: '08:30', event: 'Retail Sales MoM', country: 'US', importance: 'high', previous: '0.6%', forecast: '0.4%', actual: '0.3%' },
  { id: 'e2', date: '2026-03-18', time: '10:00', event: 'Business Inventories', country: 'US', importance: 'low', previous: '0.1%', forecast: '0.2%', actual: '0.2%' },
  { id: 'e3', date: '2026-03-19', time: '14:00', event: 'FOMC Rate Decision', country: 'US', importance: 'high', previous: '5.50%', forecast: '5.50%', actual: '--' },
  { id: 'e4', date: '2026-03-19', time: '14:30', event: 'FOMC Press Conference', country: 'US', importance: 'high', previous: '--', forecast: '--', actual: '--' },
  { id: 'e5', date: '2026-03-20', time: '08:30', event: 'Initial Jobless Claims', country: 'US', importance: 'medium', previous: '209K', forecast: '215K', actual: '--' },
  { id: 'e6', date: '2026-03-20', time: '08:30', event: 'Philadelphia Fed Index', country: 'US', importance: 'medium', previous: '5.2', forecast: '3.8', actual: '--' },
  { id: 'e7', date: '2026-03-21', time: '09:45', event: 'Manufacturing PMI', country: 'US', importance: 'high', previous: '52.2', forecast: '51.8', actual: '--' },
  { id: 'e8', date: '2026-03-21', time: '09:45', event: 'Services PMI', country: 'US', importance: 'high', previous: '52.3', forecast: '52.0', actual: '--' },
  { id: 'e9', date: '2026-03-21', time: '10:00', event: 'Existing Home Sales', country: 'US', importance: 'medium', previous: '4.00M', forecast: '3.95M', actual: '--' },
  { id: 'e10', date: '2026-03-24', time: '09:45', event: 'Flash Composite PMI', country: 'EU', importance: 'high', previous: '49.2', forecast: '49.5', actual: '--' },
  { id: 'e11', date: '2026-03-25', time: '10:00', event: 'Consumer Confidence', country: 'US', importance: 'medium', previous: '106.7', forecast: '105.0', actual: '--' },
  { id: 'e12', date: '2026-03-26', time: '08:30', event: 'Durable Goods Orders', country: 'US', importance: 'high', previous: '-6.1%', forecast: '1.2%', actual: '--' },
  { id: 'e13', date: '2026-03-27', time: '08:30', event: 'GDP QoQ (Final)', country: 'US', importance: 'high', previous: '3.2%', forecast: '3.2%', actual: '--' },
  { id: 'e14', date: '2026-03-28', time: '08:30', event: 'Core PCE Price Index', country: 'US', importance: 'high', previous: '0.4%', forecast: '0.3%', actual: '--' },
  { id: 'e15', date: '2026-03-28', time: '10:00', event: 'Michigan Consumer Sent.', country: 'US', importance: 'medium', previous: '76.9', forecast: '77.5', actual: '--' },
  { id: 'e16', date: '2026-03-31', time: '05:00', event: 'CPI Flash Estimate YoY', country: 'EU', importance: 'high', previous: '2.6%', forecast: '2.5%', actual: '--' },
];

const IMPORTANCE_VARIANT: Record<string, 'danger' | 'warning' | 'default'> = {
  high: 'danger',
  medium: 'warning',
  low: 'default',
};

const FILTER_OPTIONS = ['All', 'High', 'Medium', 'Low'];

const EconomicCalendar: Component<AppletProps> = (props) => {
  const [events] = createSignal<EconEvent[]>(MOCK_EVENTS);
  const [loading] = createSignal(false);

  const { filtered, filter, setFilter } = useFilter<EconEvent>(
    events,
    (item, f) => item.importance === f.toLowerCase(),
  );

  const isPast = (date: string) => date <= '2026-03-18';

  return (
    <AppletShell
      title="Economic Calendar"
      status="connected"
      toolbar={
        <FilterBar options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
      }
    >
      <DataList
        items={filtered}
        loading={loading}
        keyFn={(e) => e.id}
        renderItem={(evt) => (
          <div class={`px-3 py-2 hover:bg-surface-2 transition-colors ${isPast(evt.date) ? 'opacity-60' : ''}`}>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] text-text-secondary tabular-nums">{evt.date} {evt.time}</span>
              <Badge text={evt.importance} variant={IMPORTANCE_VARIANT[evt.importance]} size="sm" />
              <span class="text-[10px] text-text-secondary">{evt.country}</span>
            </div>
            <div class="text-xs font-semibold">{evt.event}</div>
            <div class="flex gap-3 mt-1">
              <span class="text-[10px] text-text-secondary">Prev: <span class="text-text-primary">{evt.previous}</span></span>
              <span class="text-[10px] text-text-secondary">Fcst: <span class="text-text-primary">{evt.forecast}</span></span>
              <span class="text-[10px] text-text-secondary">Act: <span class={evt.actual !== '--' ? 'text-text-primary font-semibold' : 'text-text-secondary'}>{evt.actual}</span></span>
            </div>
          </div>
        )}
      />
    </AppletShell>
  );
};

export default EconomicCalendar;
