// ============================================================================
// EVENT TIMELINE — Cross-applet event timeline aggregator
// ============================================================================

import { Component, createSignal, createMemo, For, Show } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import type { Earthquake, NewsItem, Aircraft } from '../../core/types';
import { AppletShell, Badge, useEventBus, timeAgo, generateId } from '../../sdk';

export const manifest: AppletManifest = {
  id: 'event-timeline',
  name: 'Event Timeline',
  description: 'Cross-applet event timeline aggregating updates from multiple sources',
  category: 'analytics',
  icon: 'clock',
  defaultSize: { w: 3, h: 4 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  requiresMap: false,
};

interface TimelineEntry {
  id: string;
  timestamp: number;
  source: string;
  description: string;
  variant: 'danger' | 'warning' | 'info' | 'default';
}

const MAX_ENTRIES = 100;

const EventTimeline: Component<AppletProps> = (props) => {
  const [entries, setEntries] = createSignal<TimelineEntry[]>([]);

  function addEntry(source: string, description: string, variant: TimelineEntry['variant']) {
    setEntries((prev) => {
      const next: TimelineEntry[] = [
        { id: generateId(), timestamp: Date.now(), source, description, variant },
        ...prev,
      ];
      return next.slice(0, MAX_ENTRIES);
    });
  }

  // Subscribe to earthquake updates
  useEventBus(props, 'earthquake:update', (quakes: Earthquake[]) => {
    if (quakes.length > 0) {
      const strongest = quakes.reduce((a, b) => (a.magnitude > b.magnitude ? a : b));
      addEntry(
        'Earthquake',
        `${quakes.length} events updated. Strongest: M${strongest.magnitude.toFixed(1)} near ${strongest.place}`,
        strongest.magnitude >= 6 ? 'danger' : strongest.magnitude >= 4.5 ? 'warning' : 'info',
      );
    }
  });

  // Subscribe to news updates
  useEventBus(props, 'news:update', (items: NewsItem[]) => {
    if (items.length > 0) {
      addEntry(
        'News',
        `${items.length} articles updated. Latest: "${items[0].title}"`,
        'default',
      );
    }
  });

  // Subscribe to aircraft updates
  useEventBus(props, 'aircraft:update', (aircraft: Aircraft[]) => {
    if (aircraft.length > 0) {
      const military = aircraft.filter((a) => a.category === 'military').length;
      const desc = military > 0
        ? `${aircraft.length} aircraft tracked, ${military} military`
        : `${aircraft.length} aircraft tracked`;
      addEntry('Aircraft', desc, military > 0 ? 'warning' : 'info');
    }
  });

  const count = createMemo(() => entries().length);

  return (
    <AppletShell
      title="Event Timeline"
      status="connected"
      statusText={`${count()} events`}
    >
      <Show when={count() === 0}>
        <div class="flex items-center justify-center h-32 text-text-secondary text-sm">
          Waiting for events from other applets...
        </div>
      </Show>
      <Show when={count() > 0}>
        <ul class="divide-y divide-border">
          <For each={entries()}>
            {(entry) => (
              <li class="px-3 py-2 hover:bg-surface-2 transition-colors">
                <div class="flex items-center gap-2">
                  <Badge text={entry.source} variant={entry.variant} />
                  <span class="text-[10px] text-text-secondary ml-auto shrink-0">
                    {timeAgo(entry.timestamp)}
                  </span>
                </div>
                <p class="text-xs text-text-primary mt-1 leading-relaxed">
                  {entry.description}
                </p>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </AppletShell>
  );
};

export default EventTimeline;
