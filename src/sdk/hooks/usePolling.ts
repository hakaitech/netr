// ============================================================================
// usePolling — Reactive polling hook with auto-cleanup
// ============================================================================

import { createSignal, onMount, onCleanup, Accessor } from 'solid-js';

interface UsePollingOptions<R, T> {
  /** Run immediately on mount (default true) */
  immediate?: boolean;
  /** Transform raw response to desired type */
  transform?: (raw: R) => T;
  /** Called after successful fetch */
  onSuccess?: (data: T) => void;
  /** Cache TTL passed to HttpService (ms) */
  cacheTtl?: number;
}

interface UsePollingResult<T> {
  data: Accessor<T | null>;
  loading: Accessor<boolean>;
  error: Accessor<string | null>;
  refresh: () => Promise<void>;
}

export function usePolling<T, R = T>(
  fetcher: () => Promise<R>,
  intervalMs: number,
  options?: UsePollingOptions<R, T>,
): UsePollingResult<T> {
  const immediate = options?.immediate ?? true;
  const transform = options?.transform as ((raw: R) => T) | undefined;
  const onSuccess = options?.onSuccess;

  const [data, setData] = createSignal<T | null>(null);
  const [loading, setLoading] = createSignal<boolean>(true);
  const [error, setError] = createSignal<string | null>(null);

  async function doFetch(): Promise<void> {
    try {
      const raw = await fetcher();
      const result = transform ? transform(raw) : (raw as unknown as T);
      setData(() => result);
      setError(null);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }

  let interval: ReturnType<typeof setInterval> | undefined;

  onMount(() => {
    if (immediate) {
      doFetch();
    }
    interval = setInterval(doFetch, intervalMs);
  });

  onCleanup(() => {
    if (interval !== undefined) {
      clearInterval(interval);
    }
  });

  return {
    data,
    loading,
    error,
    refresh: doFetch,
  };
}
