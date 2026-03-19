// ============================================================================
// EMBED IFRAME — Embed any URL in a sandboxed iframe
// ============================================================================

import { Component, Show, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import { AppletShell, useAppletState } from '../../sdk';

export const manifest: AppletManifest = {
  id: 'embed-iframe',
  name: 'Embed',
  description: 'Embed any URL in a sandboxed iframe',
  category: 'utility',
  icon: 'external-link',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
};

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch { return false; }
}

const EmbedIframe: Component<AppletProps> = (props) => {
  const [state, setState] = useAppletState(props, { url: '' });
  const valid = createMemo(() => isValidUrl(state().url));

  return (
    <AppletShell title="Embed">
      <div class="px-3 py-2 border-b border-border shrink-0 flex gap-2">
        <input
          type="text"
          value={state().url}
          onInput={(e) => setState({ url: e.currentTarget.value })}
          placeholder="https://example.com"
          class="flex-1 bg-surface-2 text-text-primary text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-text-secondary"
        />
        <Show when={state().url && !valid()}>
          <span class="text-xs text-red-400 self-center shrink-0">Invalid URL</span>
        </Show>
      </div>
      <div class="flex-1 min-h-0">
        <Show when={valid()} fallback={
          <div class="flex items-center justify-center h-full text-text-secondary text-sm px-4 text-center">
            Enter a valid URL above to embed content.
          </div>
        }>
          <iframe
            src={state().url}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            class="w-full h-full border-none"
            title="Embedded content"
            loading="lazy"
          />
        </Show>
      </div>
    </AppletShell>
  );
};

export default EmbedIframe;
