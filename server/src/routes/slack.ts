// ============================================================================
// SLACK INTEGRATION — Webhook receiver + channel message store
// ============================================================================

import { Hono } from 'hono';

export const slack = new Hono();

// ---------------------------------------------------------------------------
// In-memory message store (per channel)
// ---------------------------------------------------------------------------

interface SlackMessage {
  id: string;
  channel: string;
  channelName: string;
  user: string;
  text: string;
  timestamp: string;
  receivedAt: number;
}

interface PinnedChannel {
  id: string;
  name: string;
  webhookPath: string;
  addedAt: number;
  messageCount: number;
}

// Channel name → messages (max 100 per channel)
const messageStore = new Map<string, SlackMessage[]>();
// Channel ID → config
const pinnedChannels = new Map<string, PinnedChannel>();

const MAX_MESSAGES_PER_CHANNEL = 100;

function generateWebhookPath(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 24; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// ---------------------------------------------------------------------------
// POST /webhook/:path — Receives Slack-format incoming webhook payloads
// ---------------------------------------------------------------------------

slack.post('/webhook/:path', async (c) => {
  const path = c.req.param('path');

  // Find the channel associated with this webhook path
  let targetChannel: PinnedChannel | null = null;
  for (const ch of pinnedChannels.values()) {
    if (ch.webhookPath === path) {
      targetChannel = ch;
      break;
    }
  }

  if (!targetChannel) {
    return c.json({ error: 'Unknown webhook path' }, 404);
  }

  const contentType = c.req.header('content-type') || '';

  let payload: Record<string, unknown>;

  if (contentType.includes('application/json')) {
    payload = await c.req.json() as Record<string, unknown>;
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = await c.req.parseBody();
    // Slack sends payload as form-encoded JSON string
    const raw = form['payload'];
    if (typeof raw === 'string') {
      payload = JSON.parse(raw) as Record<string, unknown>;
    } else {
      payload = form as Record<string, unknown>;
    }
  } else {
    payload = await c.req.json() as Record<string, unknown>;
  }

  // Handle Slack URL verification challenge
  if (payload.type === 'url_verification') {
    return c.json({ challenge: payload.challenge });
  }

  // Extract message from various Slack event formats
  const event = (payload.event || payload) as Record<string, unknown>;
  const text = (event.text as string) || (payload.text as string) || JSON.stringify(payload);
  const user = (event.user as string) || (event.username as string) || (payload.user_name as string) || 'unknown';
  const ts = (event.ts as string) || String(Date.now() / 1000);

  const message: SlackMessage = {
    id: `${targetChannel.id}-${ts}-${Math.random().toString(36).slice(2, 8)}`,
    channel: targetChannel.id,
    channelName: targetChannel.name,
    user,
    text,
    timestamp: ts,
    receivedAt: Date.now(),
  };

  // Store message
  const existing = messageStore.get(targetChannel.id) || [];
  existing.unshift(message);
  if (existing.length > MAX_MESSAGES_PER_CHANNEL) {
    existing.length = MAX_MESSAGES_PER_CHANNEL;
  }
  messageStore.set(targetChannel.id, existing);
  targetChannel.messageCount = existing.length;

  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// GET /channels — List pinned channels
// ---------------------------------------------------------------------------

slack.get('/channels', (c) => {
  const channels = Array.from(pinnedChannels.values()).sort(
    (a, b) => b.addedAt - a.addedAt,
  );
  return c.json({ channels, count: channels.length });
});

// ---------------------------------------------------------------------------
// POST /channels — Pin a new channel
// ---------------------------------------------------------------------------

slack.post('/channels', async (c) => {
  const body = (await c.req.json()) as { id?: string; name?: string };
  if (!body.name) {
    return c.json({ error: 'name is required' }, 400);
  }

  const id = body.id || body.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  if (pinnedChannels.has(id)) {
    return c.json({ error: 'Channel already pinned', channel: pinnedChannels.get(id) }, 409);
  }

  const webhookPath = generateWebhookPath();
  const channel: PinnedChannel = {
    id,
    name: body.name,
    webhookPath,
    addedAt: Date.now(),
    messageCount: 0,
  };

  pinnedChannels.set(id, channel);
  messageStore.set(id, []);

  return c.json({
    channel,
    webhookUrl: `/api/slack/webhook/${webhookPath}`,
  }, 201);
});

// ---------------------------------------------------------------------------
// DELETE /channels/:id — Unpin a channel
// ---------------------------------------------------------------------------

slack.delete('/channels/:id', (c) => {
  const id = c.req.param('id');
  if (!pinnedChannels.has(id)) {
    return c.json({ error: 'Channel not found' }, 404);
  }

  pinnedChannels.delete(id);
  messageStore.delete(id);

  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// GET /messages?channel=x — Get messages for a channel (or all)
// ---------------------------------------------------------------------------

slack.get('/messages', (c) => {
  const channelId = c.req.query('channel');
  const limit = parseInt(c.req.query('limit') || '50');

  if (channelId) {
    const messages = (messageStore.get(channelId) || []).slice(0, limit);
    return c.json({ messages, count: messages.length });
  }

  // All channels, interleaved by receivedAt
  const all: SlackMessage[] = [];
  for (const msgs of messageStore.values()) {
    all.push(...msgs);
  }
  all.sort((a, b) => b.receivedAt - a.receivedAt);

  return c.json({ messages: all.slice(0, limit), count: Math.min(all.length, limit) });
});

// ---------------------------------------------------------------------------
// POST /test-message — Send a test message to a pinned channel (for dev)
// ---------------------------------------------------------------------------

slack.post('/test-message', async (c) => {
  const body = (await c.req.json()) as { channel: string; user?: string; text?: string };
  if (!body.channel) {
    return c.json({ error: 'channel is required' }, 400);
  }

  const channel = pinnedChannels.get(body.channel);
  if (!channel) {
    return c.json({ error: 'Channel not pinned' }, 404);
  }

  const message: SlackMessage = {
    id: `${channel.id}-${Date.now()}-test`,
    channel: channel.id,
    channelName: channel.name,
    user: body.user || 'test-user',
    text: body.text || `Test message at ${new Date().toISOString()}`,
    timestamp: String(Date.now() / 1000),
    receivedAt: Date.now(),
  };

  const existing = messageStore.get(channel.id) || [];
  existing.unshift(message);
  if (existing.length > MAX_MESSAGES_PER_CHANNEL) {
    existing.length = MAX_MESSAGES_PER_CHANNEL;
  }
  messageStore.set(channel.id, existing);
  channel.messageCount = existing.length;

  return c.json({ ok: true, message });
});
