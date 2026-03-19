// ============================================================================
// LoadingState & ErrorState — Centered status displays
// ============================================================================

import { JSX, Show } from 'solid-js';

// ---------------------------------------------------------------------------
// LoadingState
// ---------------------------------------------------------------------------

interface LoadingStateProps {
  message?: string;
}

export function LoadingState(props: LoadingStateProps): JSX.Element {
  return (
    <div class="flex flex-col items-center justify-center h-full gap-3 text-text-secondary">
      {/* Spinner */}
      <svg
        class="animate-spin h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="3"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
        />
      </svg>
      <span class="text-sm">{props.message ?? 'Loading...'}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ErrorState
// ---------------------------------------------------------------------------

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState(props: ErrorStateProps): JSX.Element {
  return (
    <div class="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
      <span class="text-danger text-sm">{props.message}</span>
      <Show when={props.onRetry}>
        <button
          class="px-3 py-1 text-xs font-medium rounded bg-surface-2 text-text-primary hover:bg-surface-3 transition-colors border border-border"
          onClick={() => props.onRetry?.()}
        >
          Retry
        </button>
      </Show>
    </div>
  );
}
