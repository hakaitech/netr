// ============================================================================
// EVENT BUS — Typed pub/sub with microtask batching
// ============================================================================

import type { EventChannelMap } from '../core/types';

type Handler<T = unknown> = (data: T) => void;

export class EventBus {
  private listeners = new Map<string, Set<Handler>>();
  private pending = new Map<string, unknown>();
  private flushScheduled = false;

  /**
   * Subscribe to a typed channel. Returns an unsubscribe function.
   */
  on<K extends keyof EventChannelMap>(
    channel: K,
    handler: Handler<EventChannelMap[K]>,
  ): () => void {
    const key = channel as string;
    let set = this.listeners.get(key);
    if (!set) {
      set = new Set();
      this.listeners.set(key, set);
    }
    set.add(handler as Handler);

    return () => {
      this.off(channel, handler);
    };
  }

  /**
   * Emit data on a channel. Multiple emissions within the same synchronous
   * block are coalesced: only the latest value per channel is delivered, and
   * listeners fire once per channel per microtask flush.
   */
  emit<K extends keyof EventChannelMap>(
    channel: K,
    data: EventChannelMap[K],
  ): void {
    this.pending.set(channel as string, data);
    this.scheduleFlush();
  }

  /**
   * Remove a specific handler from a channel.
   */
  off<K extends keyof EventChannelMap>(
    channel: K,
    handler: Handler<EventChannelMap[K]>,
  ): void {
    const set = this.listeners.get(channel as string);
    if (set) {
      set.delete(handler as Handler);
      if (set.size === 0) {
        this.listeners.delete(channel as string);
      }
    }
  }

  /**
   * Remove all listeners from every channel.
   */
  clear(): void {
    this.listeners.clear();
    this.pending.clear();
    this.flushScheduled = false;
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private scheduleFlush(): void {
    if (this.flushScheduled) return;
    this.flushScheduled = true;

    queueMicrotask(() => {
      this.flush();
    });
  }

  private flush(): void {
    this.flushScheduled = false;

    // Snapshot pending emissions and clear the map before dispatching so that
    // handlers that re-emit within their callback queue a new microtask rather
    // than interfering with the current flush.
    const batch = new Map(this.pending);
    this.pending.clear();

    for (const [channel, data] of batch) {
      const set = this.listeners.get(channel);
      if (!set) continue;
      // Iterate a snapshot so removals during iteration are safe.
      for (const handler of [...set]) {
        try {
          handler(data);
        } catch (err) {
          console.error(`[EventBus] handler error on "${channel}":`, err);
        }
      }
    }
  }
}
