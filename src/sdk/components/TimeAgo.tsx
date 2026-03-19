// ============================================================================
// TimeAgo — Relative time display with auto-refresh
// ============================================================================

import { JSX, createSignal, onMount, onCleanup } from 'solid-js';
import { timeAgo } from '../utils';

interface TimeAgoProps {
  timestamp: number;
}

/**
 * Renders a human-readable relative time string ("5m ago", "2h ago") and
 * automatically re-renders every 30 seconds to stay current.
 */
export function TimeAgo(props: TimeAgoProps): JSX.Element {
  const [text, setText] = createSignal(timeAgo(props.timestamp));

  let interval: ReturnType<typeof setInterval> | undefined;

  onMount(() => {
    interval = setInterval(() => {
      setText(timeAgo(props.timestamp));
    }, 30_000);
  });

  onCleanup(() => {
    if (interval !== undefined) {
      clearInterval(interval);
    }
  });

  return (
    <span class="text-xs text-text-secondary">{text()}</span>
  );
}
