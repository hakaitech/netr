// ============================================================================
// COUNTDOWN TIMER — Countdown to a user-specified date with large display
// ============================================================================

import { Component, createSignal, createMemo, onMount, onCleanup } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import { AppletShell, useAppletState, StatGrid } from '../../sdk';

export const manifest: AppletManifest = {
  id: 'countdown-timer',
  name: 'Countdown Timer',
  description: 'Countdown to a target date and time',
  category: 'utility',
  icon: 'timer',
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 2, h: 2 },
  resizable: true,
};

function pad2(n: number): string { return n.toString().padStart(2, '0'); }

const CountdownTimer: Component<AppletProps> = (props) => {
  const [state, setState] = useAppletState(props, { targetDate: '', label: 'Countdown' });
  const [tick, setTick] = createSignal(0);

  let timer: ReturnType<typeof setInterval>;
  onMount(() => { timer = setInterval(() => setTick(t => t + 1), 1000); });
  onCleanup(() => clearInterval(timer));

  const diff = createMemo(() => {
    void tick();
    const target = state().targetDate;
    if (!target) return null;
    const ms = new Date(target).getTime() - Date.now();
    return ms;
  });

  const parts = createMemo(() => {
    const ms = diff();
    if (ms === null) return null;
    const isPast = ms < 0;
    const abs = Math.abs(ms);
    const totalSec = Math.floor(abs / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return { days, hours, minutes, seconds, isPast };
  });

  const stats = createMemo(() => {
    const p = parts();
    if (!p) return [
      { label: 'Days', value: '--' },
      { label: 'Hours', value: '--' },
      { label: 'Min', value: '--' },
      { label: 'Sec', value: '--' },
    ];
    const color = p.isPast ? 'text-red-400' : 'text-emerald-400';
    return [
      { label: 'Days', value: p.days.toString(), color },
      { label: 'Hours', value: pad2(p.hours), color },
      { label: 'Min', value: pad2(p.minutes), color },
      { label: 'Sec', value: pad2(p.seconds), color },
    ];
  });

  return (
    <AppletShell title={state().label || 'Countdown'}>
      <div class="p-3 space-y-3">
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-text-secondary block mb-1">Target Date/Time</label>
            <input
              type="datetime-local"
              value={state().targetDate}
              onInput={(e) => setState({ targetDate: e.currentTarget.value })}
              class="w-full bg-surface-2 text-text-primary text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label class="text-xs text-text-secondary block mb-1">Label</label>
            <input
              type="text"
              value={state().label}
              onInput={(e) => setState({ label: e.currentTarget.value })}
              placeholder="Countdown"
              class="w-full bg-surface-2 text-text-primary text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-text-secondary"
            />
          </div>
        </div>

        <StatGrid stats={stats()} columns={4} />

        {parts()?.isPast && (
          <div class="text-center text-xs text-red-400 font-medium">Target date has passed</div>
        )}
        {!state().targetDate && (
          <div class="text-center text-xs text-text-secondary">Set a target date above to start counting down.</div>
        )}
      </div>
    </AppletShell>
  );
};

export default CountdownTimer;
