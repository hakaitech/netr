// ============================================================================
// PLUGIN REGISTRY — Central registry for all applets (built-in and external)
// ============================================================================

import type { AppletModule, AppletManifest } from './applet.contract';

interface RegisteredApplet {
  manifest: AppletManifest;
  loader: () => Promise<AppletModule>;
  external: boolean;
}

export class PluginRegistry {
  private registered = new Map<string, RegisteredApplet>();

  /** Register a built-in applet with static import */
  registerBuiltin(
    id: string,
    manifest: AppletManifest,
    loader: () => Promise<AppletModule>,
  ): void {
    this.registered.set(id, { manifest, loader, external: false });
  }

  /** Register an external plugin from a manifest URL */
  async registerExternal(manifestUrl: string): Promise<void> {
    const res = await fetch(manifestUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch plugin manifest: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    // Validate required fields
    const required = ['id', 'name', 'description', 'category', 'icon', 'entry'] as const;
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`External plugin manifest missing required field: ${field}`);
      }
    }

    const manifest: AppletManifest = {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      icon: data.icon,
      defaultSize: data.defaultSize ?? { w: 3, h: 3 },
      minSize: data.minSize ?? { w: 2, h: 2 },
      maxSize: data.maxSize,
      resizable: data.resizable ?? true,
      refreshInterval: data.refreshInterval,
      requiresMap: data.requiresMap,
      external: true,
      permissions: data.permissions ?? [],
      configSchema: data.configSchema,
      version: data.version,
      author: data.author,
    };

    const entryUrl = new URL(data.entry, manifestUrl).href;

    const loader = async (): Promise<AppletModule> => {
      const mod = await import(/* @vite-ignore */ entryUrl);
      return mod as AppletModule;
    };

    this.registered.set(manifest.id, { manifest, loader, external: true });
  }

  /** Get all manifests for the catalog */
  getManifests(): AppletManifest[] {
    return [...this.registered.values()].map((r) => r.manifest);
  }

  /** Get manifests filtered by category */
  getManifestsByCategory(category: string): AppletManifest[] {
    if (category === 'all') return this.getManifests();
    return this.getManifests().filter((m) => m.category === category);
  }

  /** Get the loader for an applet */
  getLoader(appletId: string): (() => Promise<AppletModule>) | undefined {
    return this.registered.get(appletId)?.loader;
  }

  /** Check if an applet exists */
  has(appletId: string): boolean {
    return this.registered.has(appletId);
  }

  /** Check if external */
  isExternal(appletId: string): boolean {
    return this.registered.get(appletId)?.external ?? false;
  }

  /** Get the manifest for a specific applet */
  getManifest(appletId: string): AppletManifest | undefined {
    return this.registered.get(appletId)?.manifest;
  }

  /** Get count */
  get size(): number {
    return this.registered.size;
  }
}
