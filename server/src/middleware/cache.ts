import type { Context, Next } from 'hono';

interface CacheEntry {
  body: string;
  contentType: string;
  status: number;
  expires: number;
}

const cache = new Map<string, CacheEntry>();

const MAX_CACHE_SIZE = 500;

function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expires <= now) {
      cache.delete(key);
    }
  }
}

export function cacheMiddleware(defaultTtl = 30000) {
  return async (c: Context, next: Next) => {
    if (c.req.method !== 'GET') {
      return next();
    }

    const key = c.req.url;
    const cached = cache.get(key);

    if (cached && cached.expires > Date.now()) {
      c.header('x-cache', 'HIT');
      c.header('content-type', cached.contentType);
      return c.body(cached.body, cached.status as 200);
    }

    await next();

    if (!c.res || c.res.status >= 400) {
      c.header('x-cache', 'MISS');
      return;
    }

    const ttlHeader = c.res.headers.get('x-cache-ttl');
    const ttl = ttlHeader ? parseInt(ttlHeader, 10) : defaultTtl;

    const cloned = c.res.clone();
    const responseBody = await cloned.text();
    const contentType = cloned.headers.get('content-type') || 'application/json';

    if (cache.size >= MAX_CACHE_SIZE) {
      evictExpired();
      if (cache.size >= MAX_CACHE_SIZE) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey !== undefined) {
          cache.delete(oldestKey);
        }
      }
    }

    cache.set(key, {
      body: responseBody,
      contentType,
      status: cloned.status,
      expires: Date.now() + ttl,
    });

    c.header('x-cache', 'MISS');
  };
}

export function clearCache(): void {
  cache.clear();
}

export function getCacheSize(): number {
  return cache.size;
}
