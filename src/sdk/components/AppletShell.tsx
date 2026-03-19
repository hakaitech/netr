// ============================================================================
// AppletShell — Standard applet frame with header and scrollable body
// ============================================================================

import { JSX, ParentProps, Show } from 'solid-js';

interface AppletShellProps extends ParentProps {
  title: string;
  /** Optional status dot: 'connected' | 'error' | 'loading' | 'warning' */
  status?: 'connected' | 'error' | 'loading' | 'warning';
  /** Optional status text next to the dot */
  statusText?: string;
  /** Render in header right side (filters, dropdowns) */
  headerRight?: JSX.Element;
  /** Extra content below header, above scroll body (filter bar, stats bar) */
  toolbar?: JSX.Element;
}

const STATUS_DOT_COLORS: Record<string, string> = {
  connected: 'bg-emerald-400',
  error: 'bg-red-400',
  loading: 'bg-amber-400 animate-pulse',
  warning: 'bg-amber-400',
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  connected: 'text-emerald-400',
  error: 'text-red-400',
  loading: 'text-text-secondary',
  warning: 'text-amber-400',
};

export function AppletShell(props: AppletShellProps): JSX.Element {
  return (
    <div class="flex flex-col h-full bg-surface-1 text-text-primary">
      {/* Header */}
      <div class="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <div class="flex items-center gap-2">
          <h2 class="text-sm font-semibold tracking-wide uppercase">
            {props.title}
          </h2>
          <Show when={props.status}>
            <div class="flex items-center gap-1.5">
              <span
                class={`w-2 h-2 rounded-full ${STATUS_DOT_COLORS[props.status!] ?? ''}`}
              />
              <Show when={props.statusText}>
                <span
                  class={`text-[10px] ${STATUS_TEXT_COLORS[props.status!] ?? 'text-text-secondary'}`}
                >
                  {props.statusText}
                </span>
              </Show>
            </div>
          </Show>
        </div>
        <Show when={props.headerRight}>
          {props.headerRight}
        </Show>
      </div>

      {/* Toolbar */}
      <Show when={props.toolbar}>
        {props.toolbar}
      </Show>

      {/* Scrollable body */}
      <div class="flex-1 overflow-y-auto min-h-0">
        {props.children}
      </div>
    </div>
  );
}
