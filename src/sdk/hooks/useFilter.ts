// ============================================================================
// useFilter — Generic list filtering with reactive signals
// ============================================================================

import { createSignal, createMemo, Accessor } from 'solid-js';

/**
 * Provides a reactive filter over a list of items. The `predicate` receives
 * each item and the current filter string; return true to keep the item.
 */
export function useFilter<T>(
  items: Accessor<T[]>,
  predicate: (item: T, filter: string) => boolean,
  defaultFilter?: string,
): {
  filtered: Accessor<T[]>;
  filter: Accessor<string>;
  setFilter: (f: string) => void;
} {
  const [filter, setFilter] = createSignal<string>(defaultFilter ?? '');

  const filtered = createMemo(() => {
    const f = filter();
    if (f === '' || f === 'All') return items();
    return items().filter((item) => predicate(item, f));
  });

  return { filtered, filter, setFilter };
}
