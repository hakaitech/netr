import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { cacheMiddleware } from './middleware/cache';
import { earthquakes } from './routes/earthquakes';
import { news } from './routes/news';
import { flights } from './routes/flights';
import { health } from './routes/health';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  })
);

// Simple in-memory cache middleware for all API routes
app.use('/api/*', cacheMiddleware());

// Routes
app.route('/api/earthquakes', earthquakes);
app.route('/api/news', news);
app.route('/api/flights', flights);
app.route('/api/health', health);

// Root fallback
app.get('/', (c) => {
  return c.json({
    name: 'netr-api',
    version: '0.1.0',
    endpoints: [
      '/api/earthquakes',
      '/api/news',
      '/api/flights',
      '/api/health',
    ],
  });
});

// For local dev with Node
import { serve } from '@hono/node-server';

const port = parseInt(process.env.PORT || '8787');
serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`);
});

export default app;
