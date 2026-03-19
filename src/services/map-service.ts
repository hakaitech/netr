// ============================================================================
// MAP SERVICE — Shared Deck.gl layer management with coalesced updates
// ============================================================================

import type { Layer } from '@deck.gl/core';

export class MapService {
  private layers = new Map<string, Layer[]>();
  private updateScheduled = false;
  private onLayersChange: ((layers: Layer[]) => void) | null = null;

  /**
   * Called by the map applet to receive layer updates whenever any applet
   * registers, updates, or removes layers.
   */
  setLayerChangeHandler(handler: (layers: Layer[]) => void): void {
    this.onLayersChange = handler;
    // Immediately push current state to the new handler.
    handler(this.getAllLayers());
  }

  /**
   * Called by applets to register or replace their layers.
   * @param ownerId  Unique identifier for the owning applet instance.
   * @param layers   Array of Deck.gl layers to register.
   */
  setLayers(ownerId: string, layers: Layer[]): void {
    this.layers.set(ownerId, layers);
    this.scheduleUpdate();
  }

  /**
   * Called when an applet unmounts to clean up its layers.
   */
  removeLayers(ownerId: string): void {
    if (this.layers.delete(ownerId)) {
      this.scheduleUpdate();
    }
  }

  /**
   * Returns every registered layer from every applet, flattened into a single
   * array. Iteration order follows Map insertion order (oldest owner first).
   */
  getAllLayers(): Layer[] {
    const result: Layer[] = [];
    for (const layerSet of this.layers.values()) {
      for (const layer of layerSet) {
        result.push(layer);
      }
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  /**
   * Coalesces rapid-fire setLayers / removeLayers calls into a single
   * notification per microtask tick.
   */
  private scheduleUpdate(): void {
    if (this.updateScheduled) return;
    this.updateScheduled = true;

    queueMicrotask(() => {
      this.updateScheduled = false;
      if (this.onLayersChange) {
        this.onLayersChange(this.getAllLayers());
      }
    });
  }
}
