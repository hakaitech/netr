// ============================================================================
// HTTP SERVICE — Fetch wrapper with dedup, TTL cache, and timeout
// ============================================================================

interface HttpOptions {
  /** Request timeout in milliseconds. Default: 15 000. */
  timeout?: number;
  /** Cache time-to-live in milliseconds. Default: 0 (no cache). */
  cacheTtl?: number;
  /** Additional request headers. */
  headers?: Record<string, string>;
}

interface CacheEntry {
  data: unknown;
  expires: number;
}

const DEFAULT_TIMEOUT = 15_000;

export class HttpService {
  private cache = new Map<string, CacheEntry>();
  private inflight = new Map<string, Promise<unknown>>();

  /**
   * Perform a GET request with optional caching and deduplication.
   *
   * If an identical GET is already in-flight, the existing promise is returned
   * instead of issuing a duplicate request.
   */
  async get<T = unknown>(url: string, options?: HttpOptions): Promise<T> {
    const cached = this.readCache(url);
    if (cached !== undefined) return cached as T;

    const existing = this.inflight.get(url);
    if (existing) return existing as Promise<T>;

    const promise = this.request<T>(url, { method: 'GET' }, options);

    this.inflight.set(url, promise);

    // Always clean up the inflight entry regardless of success or failure.
    promise.finally(() => {
      this.inflight.delete(url);
    });

    return promise;
  }

  /**
   * Perform a POST request. POST requests are never deduplicated or cached.
   */
  async post<T = unknown>(
    url: string,
    body: unknown,
    options?: HttpOptions,
  ): Promise<T> {
    return this.request<T>(
      url,
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      },
      options,
    );
  }

  /**
   * Remove all cached responses.
   */
  clearCache(): void {
    this.cache.clear();
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private readCache(url: string): unknown | undefined {
    const entry = this.cache.get(url);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.cache.delete(url);
      return undefined;
    }
    return entry.data;
  }

  private writeCache(url: string, data: unknown, ttl: number): void {
    if (ttl <= 0) return;
    this.cache.set(url, { data, expires: Date.now() + ttl });
  }

  private async request<T>(
    url: string,
    init: RequestInit,
    options?: HttpOptions,
  ): Promise<T> {
    const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
    const cacheTtl = options?.cacheTtl ?? 0;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const mergedHeaders: Record<string, string> = {
      ...(init.headers as Record<string, string> | undefined),
      ...options?.headers,
    };

    try {
      const response = await fetch(url, {
        ...init,
        headers: mergedHeaders,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new HttpError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          url,
        );
      }

      const data = (await response.json()) as T;

      if (init.method === 'GET') {
        this.writeCache(url, data, cacheTtl);
      }

      return data;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new HttpError(`Request timed out after ${timeout}ms`, 0, url);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}

// ---------------------------------------------------------------------------
// Custom error class
// ---------------------------------------------------------------------------

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly url: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
