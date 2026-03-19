// ============================================================================
// CACHE SERVICE — IndexedDB + in-memory cache (idb-keyval)
// ============================================================================

import { get, set, del, keys } from 'idb-keyval';

interface MemoryEntry {
  data: unknown;
  /** Timestamp (ms) at which this entry expires. 0 = never. */
  expires: number;
}

interface StoredEntry {
  data: unknown;
  expires: number;
}

const STORE_PREFIX = 'wm:';

export class CacheService {
  private memory = new Map<string, MemoryEntry>();

  /**
   * Retrieve a value. Checks in-memory cache first, then falls back to
   * IndexedDB. Returns `undefined` if the key does not exist or has expired.
   */
  async get<T>(key: string): Promise<T | undefined> {
    // 1. In-memory lookup
    const mem = this.memory.get(key);
    if (mem) {
      if (mem.expires !== 0 && Date.now() > mem.expires) {
        this.memory.delete(key);
      } else {
        return mem.data as T;
      }
    }

    // 2. IndexedDB lookup
    try {
      const stored: StoredEntry | undefined = await get(STORE_PREFIX + key);
      if (!stored) return undefined;

      if (stored.expires !== 0 && Date.now() > stored.expires) {
        // Expired — clean up asynchronously, do not block the caller.
        del(STORE_PREFIX + key).catch(() => {});
        return undefined;
      }

      // Promote back into memory cache.
      this.memory.set(key, { data: stored.data, expires: stored.expires });
      return stored.data as T;
    } catch {
      // IndexedDB may be unavailable (e.g., private browsing quota exceeded).
      return undefined;
    }
  }

  /**
   * Write a value to both in-memory and IndexedDB caches.
   *
   * @param key     Cache key.
   * @param value   Serializable value.
   * @param ttlMs   Time-to-live in milliseconds. Omit or pass 0 for no expiry.
   */
  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    const expires = ttlMs && ttlMs > 0 ? Date.now() + ttlMs : 0;
    const entry: StoredEntry = { data: value, expires };

    this.memory.set(key, { data: value, expires });

    try {
      await set(STORE_PREFIX + key, entry);
    } catch {
      // Silently degrade — memory cache still works.
    }
  }

  /**
   * Delete a key from both caches.
   */
  async delete(key: string): Promise<void> {
    this.memory.delete(key);
    try {
      await del(STORE_PREFIX + key);
    } catch {
      // Silently degrade.
    }
  }

  /**
   * Remove expired entries from the in-memory cache. Call periodically
   * (e.g., on a timer) to reclaim memory.
   */
  prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.memory) {
      if (entry.expires !== 0 && now > entry.expires) {
        this.memory.delete(key);
      }
    }
  }
}
