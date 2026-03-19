import { Hono } from 'hono';
import { getCacheSize } from '../middleware/cache';

export const health = new Hono();

health.get('/', (c) => {
  return c.json({
    status: 'ok',
    timestamp: Date.now(),
    version: '0.1.0',
    uptime: typeof process !== 'undefined' && process.uptime ? process.uptime() : 0,
    cacheEntries: getCacheSize(),
  });
});
