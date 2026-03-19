// ============================================================================
// SLACK FEED — Pin channels, attach webhooks, stream messages
// ============================================================================

import {
  Component,
  createSignal,
  createMemo,
  For,
  Show,
} from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell,
  DataList,
  Badge,
  StatGrid,
  usePolling,
  useAppletState,
} from '../../sdk';

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

export const manifest: AppletManifest = {
  id: 'slack-feed',
  name: 'Slack Feed',
  description: 'Pin Slack channels and stream messages via incoming webhooks',
  category: 'utility',
  icon: 'message-square',
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 3, h: 3 },
  resizable: true,
  refreshInterval: 10_000,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PinnedChannel {
  id: string;
  name: string;
  webhookPath: string;
  addedAt: number;
  messageCount: number;
}

interface SlackMessage {
  id: string;
  channel: string;
  channelName: string;
  user: string;
  text: string;
  timestamp: string;
  receivedAt: number;
}

type View = 'messages' | 'channels';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SlackFeed: Component<AppletProps> = (props) => {
  const [_state, _setState] = useAppletState(props, {});

  const [view, setView] = createSignal<View>('messages');
  const [addingChannel, setAddingChannel] = createSignal(false);
  const [newChannelName, setNewChannelName] = createSignal('');
  const [filterChannel, setFilterChannel] = createSignal<string>('all');
  const [copiedWebhook, setCopiedWebhook] = createSignal<string | null>(null);
  const [testingChannel, setTestingChannel] = createSignal<string | null>(null);

  // -- Fetch channels ----------------------------------------------------------

  const {
    data: channels,
    loading: channelsLoading,
    refresh: refreshChannels,
  } = usePolling<PinnedChannel[], { channels: PinnedChannel[] }>(
    () => props.services.http.get<{ channels: PinnedChannel[] }>('/api/slack/channels', { cacheTtl: 5_000 }),
    15_000,
    { transform: (r) => r.channels },
  );

  // -- Fetch messages ----------------------------------------------------------

  const {
    data: messages,
    loading: messagesLoading,
    error: messagesError,
    refresh: refreshMessages,
  } = usePolling<SlackMessage[], { messages: SlackMessage[] }>(
    () => {
      const ch = filterChannel();
      const channelParam = ch !== 'all' ? `?channel=${ch}&limit=50` : '?limit=50';
      return props.services.http.get<{ messages: SlackMessage[] }>(
        `/api/slack/messages${channelParam}`,
        { cacheTtl: 5_000 },
      );
    },
    10_000,
    { transform: (r) => r.messages },
  );

  // -- Stats -------------------------------------------------------------------

  const totalMessages = createMemo(() => (messages() ?? []).length);
  const channelCount = createMemo(() => (channels() ?? []).length);
  const uniqueUsers = createMemo(() => {
    const users = new Set((messages() ?? []).map((m) => m.user));
    return users.size;
  });

  // -- Add channel -------------------------------------------------------------

  async function addChannel() {
    const name = newChannelName().trim();
    if (!name) return;

    try {
      await props.services.http.post('/api/slack/channels', { name });
      setNewChannelName('');
      setAddingChannel(false);
      refreshChannels();
    } catch (err) {
      console.error('Failed to add channel:', err);
    }
  }

  // -- Remove channel ----------------------------------------------------------

  async function removeChannel(id: string) {
    try {
      await fetch(`/api/slack/channels/${id}`, { method: 'DELETE' });
      refreshChannels();
      refreshMessages();
    } catch (err) {
      console.error('Failed to remove channel:', err);
    }
  }

  // -- Copy webhook URL --------------------------------------------------------

  async function copyWebhookUrl(channel: PinnedChannel) {
    const url = `${window.location.origin}/api/slack/webhook/${channel.webhookPath}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedWebhook(channel.id);
      setTimeout(() => setCopiedWebhook(null), 2000);
    } catch {
      // Fallback for non-HTTPS contexts
      prompt('Copy this webhook URL:', url);
    }
  }

  // -- Send test message -------------------------------------------------------

  async function sendTestMessage(channelId: string) {
    setTestingChannel(channelId);
    try {
      await props.services.http.post('/api/slack/test-message', {
        channel: channelId,
        user: 'netr-test',
        text: `Test message from Netr dashboard at ${new Date().toLocaleTimeString()}`,
      });
      refreshMessages();
    } catch (err) {
      console.error('Failed to send test message:', err);
    } finally {
      setTimeout(() => setTestingChannel(null), 500);
    }
  }

  // -- Status ------------------------------------------------------------------

  const status = () => {
    if (messagesLoading() || channelsLoading()) return 'loading' as const;
    if (messagesError()) return 'error' as const;
    return 'connected' as const;
  };

  return (
    <AppletShell
      title="Slack Feed"
      status={status()}
      statusText={messagesError() ?? `${channelCount()} channels`}
      headerRight={
        <button
          class="text-[10px] text-text-secondary hover:text-accent transition-colors px-1"
          onClick={() => setAddingChannel((v) => !v)}
        >
          + Channel
        </button>
      }
      toolbar={
        <>
          {/* Add channel form */}
          <Show when={addingChannel()}>
            <div class="px-3 py-2 border-b border-border bg-surface-2/50">
              <div class="flex gap-2">
                <input
                  class="flex-1 bg-surface-2 border border-border rounded px-2 py-1 text-xs text-text-primary outline-none focus:border-accent"
                  placeholder="Channel name (e.g. #deployments)"
                  value={newChannelName()}
                  onInput={(e) => setNewChannelName(e.currentTarget.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addChannel()}
                  autofocus
                />
                <button
                  class="px-3 py-1 rounded bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors"
                  onClick={addChannel}
                >
                  Pin
                </button>
              </div>
              <p class="text-[10px] text-text-secondary mt-1">
                After pinning, copy the webhook URL and configure it in Slack's Incoming Webhooks.
              </p>
            </div>
          </Show>

          {/* Stats */}
          <StatGrid
            columns={3}
            stats={[
              { label: 'Channels', value: String(channelCount()) },
              { label: 'Messages', value: String(totalMessages()) },
              { label: 'Users', value: String(uniqueUsers()) },
            ]}
          />

          {/* View tabs + channel filter */}
          <div class="flex items-center border-b border-border shrink-0">
            <button
              class={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                view() === 'messages'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              onClick={() => setView('messages')}
            >
              Messages
            </button>
            <button
              class={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                view() === 'channels'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              onClick={() => setView('channels')}
            >
              Channels
            </button>
            <Show when={view() === 'messages' && (channels() ?? []).length > 0}>
              <select
                class="ml-auto mr-2 bg-surface-2 border border-border rounded px-2 py-1 text-[10px] text-text-secondary outline-none"
                value={filterChannel()}
                onChange={(e) => setFilterChannel(e.currentTarget.value)}
              >
                <option value="all">All channels</option>
                <For each={channels() ?? []}>
                  {(ch) => <option value={ch.id}>{ch.name}</option>}
                </For>
              </select>
            </Show>
          </div>
        </>
      }
    >
      {/* Messages view */}
      <Show when={view() === 'messages'}>
        <DataList
          items={() => messages() ?? []}
          loading={messagesLoading}
          error={messagesError}
          emptyMessage="No messages yet. Pin a channel and send a test message to get started."
          loadingMessage="Loading messages..."
          onRetry={refreshMessages}
          renderItem={(msg) => (
            <div class="px-3 py-2.5 hover:bg-surface-2 transition-colors">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="text-xs font-semibold text-accent">{msg.user}</span>
                <Badge text={msg.channelName} variant="info" />
                <span class="text-[10px] text-text-secondary ml-auto">{timeAgo(msg.receivedAt)}</span>
              </div>
              <p class="text-sm text-text-primary whitespace-pre-wrap break-words">{msg.text}</p>
            </div>
          )}
        />
      </Show>

      {/* Channels view */}
      <Show when={view() === 'channels'}>
        <Show when={(channels() ?? []).length === 0}>
          <div class="flex items-center justify-center h-32 text-text-secondary text-sm">
            No channels pinned. Click "+ Channel" to add one.
          </div>
        </Show>
        <ul class="divide-y divide-border">
          <For each={channels() ?? []}>
            {(ch) => (
              <li class="px-3 py-3 hover:bg-surface-2 transition-colors">
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-text-primary">#{ch.name}</span>
                    <Badge
                      text={`${ch.messageCount} msgs`}
                      variant={ch.messageCount > 0 ? 'success' : 'default'}
                    />
                  </div>
                  <div class="flex items-center gap-1">
                    <button
                      class={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                        testingChannel() === ch.id
                          ? 'bg-emerald-900/60 text-emerald-300'
                          : 'bg-surface-3 text-text-secondary hover:text-text-primary'
                      }`}
                      onClick={() => sendTestMessage(ch.id)}
                    >
                      {testingChannel() === ch.id ? 'Sent!' : 'Test'}
                    </button>
                    <button
                      class={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                        copiedWebhook() === ch.id
                          ? 'bg-emerald-900/60 text-emerald-300'
                          : 'bg-surface-3 text-text-secondary hover:text-text-primary'
                      }`}
                      onClick={() => copyWebhookUrl(ch)}
                    >
                      {copiedWebhook() === ch.id ? 'Copied!' : 'Webhook URL'}
                    </button>
                    <button
                      class="text-[10px] px-2 py-0.5 rounded bg-red-900/40 text-red-400 hover:bg-red-900/60 transition-colors"
                      onClick={() => removeChannel(ch.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div class="text-[10px] text-text-secondary">
                  Added {timeAgo(ch.addedAt)} &middot; Webhook: <code class="text-accent">/api/slack/webhook/{ch.webhookPath}</code>
                </div>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </AppletShell>
  );
};

export default SlackFeed;
