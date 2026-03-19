// ============================================================================
// useAppletState — Reactive store wrapping initialState + onStateChange
// ============================================================================

import { createSignal } from 'solid-js';
import type { AppletProps } from '../../core/applet.contract';

/**
 * Merges restored state from the board config with provided defaults and
 * exposes a reactive getter/setter pair. Every call to `set` also notifies
 * the shell via `onStateChange` so the state can be persisted.
 */
export function useAppletState<S extends Record<string, unknown>>(
  props: AppletProps,
  defaults: S,
): [get: () => S, set: (partial: Partial<S>) => void] {
  const initial: S = {
    ...defaults,
    ...(props.initialState as Partial<S> | undefined),
  };

  const [state, setState] = createSignal<S>(initial);

  function update(partial: Partial<S>): void {
    const next = { ...state(), ...partial };
    setState(() => next);
    if (props.onStateChange) {
      props.onStateChange(next as Record<string, unknown>);
    }
  }

  return [state, update];
}
