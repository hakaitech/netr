// ============================================================================
// useEventBus — Subscribe to EventBus channel with auto-cleanup
// ============================================================================

import { onCleanup } from 'solid-js';
import type { AppletProps } from '../../core/applet.contract';
import type { EventChannelMap } from '../../core/types';

/**
 * Subscribe to a typed EventBus channel. The subscription is automatically
 * removed when the component unmounts. Returns an emit helper bound to the
 * same channel.
 */
export function useEventBus<K extends keyof EventChannelMap>(
  props: AppletProps,
  channel: K,
  handler: (data: EventChannelMap[K]) => void,
): { emit: (data: EventChannelMap[K]) => void } {
  const unsub = props.services.eventBus.on(channel, handler);

  onCleanup(() => {
    unsub();
  });

  return {
    emit: (data: EventChannelMap[K]) => {
      props.services.eventBus.emit(channel, data);
    },
  };
}
