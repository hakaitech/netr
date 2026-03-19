// ============================================================================
// TIMEZONE CLOCK — Configurable world clocks with live time display
// ============================================================================

import { Component, createSignal, onMount, onCleanup, For } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import { AppletShell, useAppletState } from '../../sdk';

export const manifest: AppletManifest = {
  id: 'timezone-clock',
  name: 'World Clocks',
  description: 'Configurable world clocks showing current time across timezones',
  category: 'geo',
  icon: 'clock',
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 2 },
  resizable: true,
};

const AVAILABLE_ZONES = [
  { label: 'UTC', tz: 'UTC' },
  { label: 'New York', tz: 'America/New_York' },
  { label: 'London', tz: 'Europe/London' },
  { label: 'Dubai', tz: 'Asia/Dubai' },
  { label: 'Tokyo', tz: 'Asia/Tokyo' },
  { label: 'Sydney', tz: 'Australia/Sydney' },
  { label: 'Los Angeles', tz: 'America/Los_Angeles' },
  { label: 'Chicago', tz: 'America/Chicago' },
  { label: 'Paris', tz: 'Europe/Paris' },
  { label: 'Mumbai', tz: 'Asia/Kolkata' },
  { label: 'Shanghai', tz: 'Asia/Shanghai' },
  { label: 'Singapore', tz: 'Asia/Singapore' },
  { label: 'Sao Paulo', tz: 'America/Sao_Paulo' },
  { label: 'Honolulu', tz: 'Pacific/Honolulu' },
];

const DEFAULT_SELECTED = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Dubai', 'Asia/Tokyo', 'Australia/Sydney'];

function formatTime(tz: string): string {
  try {
    return new Date().toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch { return '--:--:--'; }
}

function formatDate(tz: string): string {
  try {
    return new Date().toLocaleDateString('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' });
  } catch { return ''; }
}

function labelForTz(tz: string): string {
  return AVAILABLE_ZONES.find(z => z.tz === tz)?.label ?? tz.split('/').pop()?.replace('_', ' ') ?? tz;
}

const TimezoneClock: Component<AppletProps> = (props) => {
  const [state, setState] = useAppletState(props, { zones: DEFAULT_SELECTED, showPicker: false });
  const [tick, setTick] = createSignal(0);

  let timer: ReturnType<typeof setInterval>;
  onMount(() => { timer = setInterval(() => setTick(t => t + 1), 1000); });
  onCleanup(() => clearInterval(timer));

  function toggleZone(tz: string) {
    const cur = state().zones;
    const next = cur.includes(tz) ? cur.filter(z => z !== tz) : [...cur, tz];
    setState({ zones: next });
  }

  return (
    <AppletShell
      title="World Clocks"
      headerRight={
        <button
          class="text-xs px-2 py-0.5 rounded bg-surface-2 text-text-secondary hover:bg-surface-3 transition-colors"
          onClick={() => setState({ showPicker: !state().showPicker })}
        >
          {state().showPicker ? 'Done' : 'Edit'}
        </button>
      }
    >
      {state().showPicker && (
        <div class="px-3 py-2 border-b border-border flex flex-wrap gap-1.5 shrink-0">
          <For each={AVAILABLE_ZONES}>
            {(z) => (
              <button
                class={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                  state().zones.includes(z.tz) ? 'bg-accent text-white' : 'bg-surface-2 text-text-secondary hover:bg-surface-3'
                }`}
                onClick={() => toggleZone(z.tz)}
              >
                {z.label}
              </button>
            )}
          </For>
        </div>
      )}
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border p-px">
        {/* Force tick reactivity */}
        {void tick()}
        <For each={state().zones}>
          {(tz) => (
            <div class="bg-surface-1 p-3 text-center">
              <div class="text-xs text-text-secondary uppercase tracking-wide mb-1">{labelForTz(tz)}</div>
              <div class="text-lg font-bold tabular-nums">{formatTime(tz)}</div>
              <div class="text-[10px] text-text-secondary mt-0.5">{formatDate(tz)}</div>
            </div>
          )}
        </For>
      </div>
    </AppletShell>
  );
};

export default TimezoneClock;
