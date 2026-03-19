// ============================================================================
// useMapLayer — Auto-manages Deck.gl layer registration with MapService
// ============================================================================

import { createEffect, onCleanup } from 'solid-js';
import type { Layer } from '@deck.gl/core';
import type { AppletProps } from '../../core/applet.contract';

/**
 * Reactively registers Deck.gl layers with the shared MapService.
 * When the factory returns null or an empty array, layers are removed.
 * Layers are automatically cleaned up when the component unmounts.
 */
export function useMapLayer(
  props: AppletProps,
  layerFactory: () => Layer[] | null,
): void {
  createEffect(() => {
    const layers = layerFactory();
    if (layers && layers.length > 0) {
      props.services.mapService.setLayers(props.instanceId, layers);
    } else {
      props.services.mapService.removeLayers(props.instanceId);
    }
  });

  onCleanup(() => {
    props.services.mapService.removeLayers(props.instanceId);
  });
}
