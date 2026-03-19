// ============================================================================
// FilterBar — Category pill filter bar
// ============================================================================

import { JSX, Accessor, For } from 'solid-js';

interface FilterBarProps {
  options: string[];
  value: Accessor<string>;
  onChange: (value: string) => void;
}

export function FilterBar(props: FilterBarProps): JSX.Element {
  return (
    <div class="flex gap-1.5 flex-wrap px-3 py-2 border-b border-border shrink-0">
      <For each={props.options}>
        {(option) => (
          <button
            class={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
              props.value() === option
                ? 'bg-accent text-white'
                : 'bg-surface-2 text-text-secondary hover:bg-surface-3'
            }`}
            onClick={() => props.onChange(option)}
          >
            {option}
          </button>
        )}
      </For>
    </div>
  );
}
