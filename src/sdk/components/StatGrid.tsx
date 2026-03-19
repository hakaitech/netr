// ============================================================================
// StatGrid — Grid of numeric statistics
// ============================================================================

import { JSX, For } from 'solid-js';

interface StatItem {
  label: string;
  value: string | number;
  color?: string; // Tailwind text color class
}

interface StatGridProps {
  stats: StatItem[];
  columns?: number; // default 3
}

export function StatGrid(props: StatGridProps): JSX.Element {
  const cols = () => props.columns ?? 3;

  return (
    <div
      class="grid gap-2 px-3 py-2 border-b border-border shrink-0"
      style={{ 'grid-template-columns': `repeat(${cols()}, minmax(0, 1fr))` }}
    >
      <For each={props.stats}>
        {(stat) => (
          <div class="text-center">
            <div
              class={`text-lg font-bold tabular-nums ${stat.color ?? ''}`}
            >
              {typeof stat.value === 'number'
                ? stat.value.toLocaleString()
                : stat.value}
            </div>
            <div class="text-[10px] text-text-secondary uppercase tracking-wide">
              {stat.label}
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
