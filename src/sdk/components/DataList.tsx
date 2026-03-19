// ============================================================================
// DataList — Generic scrollable list with loading/empty/error states
// ============================================================================

import { JSX, Accessor, For, Show } from 'solid-js';
import { LoadingState, ErrorState } from './LoadingState';

interface DataListProps<T> {
  items: Accessor<T[]>;
  loading: Accessor<boolean>;
  error?: Accessor<string | null>;
  renderItem: (item: T, index: number) => JSX.Element;
  emptyMessage?: string;
  loadingMessage?: string;
  keyFn?: (item: T) => string | number;
  onRetry?: () => void;
}

export function DataList<T>(props: DataListProps<T>): JSX.Element {
  return (
    <>
      <Show when={props.loading()}>
        <LoadingState message={props.loadingMessage} />
      </Show>

      <Show when={!props.loading() && props.error?.()}>
        <ErrorState
          message={props.error!() ?? ''}
          onRetry={props.onRetry}
        />
      </Show>

      <Show when={!props.loading() && !props.error?.() && props.items().length === 0}>
        <div class="flex items-center justify-center h-32 text-text-secondary text-sm">
          {props.emptyMessage ?? 'No items'}
        </div>
      </Show>

      <Show when={!props.loading() && !props.error?.() && props.items().length > 0}>
        <ul class="divide-y divide-border">
          <For each={props.items()}>
            {(item, index) => (
              <li>{props.renderItem(item, index())}</li>
            )}
          </For>
        </ul>
      </Show>
    </>
  );
}
