# External Plugin Guide

How to build, package, and distribute Netr plugins that are loaded at runtime from external URLs.

---

## Overview

Netr supports two kinds of applets:

1. **Built-in applets** -- bundled with the application, registered in `builtin-registry.ts` with dynamic `import()`.
2. **External plugins** -- loaded at runtime from a URL. They are independent ESM bundles that conform to the same `AppletModule` interface.

This guide covers the external plugin path.

---

## Plugin Manifest Format

Every external plugin must be served alongside a JSON manifest file named `netr-plugin.json`. This manifest tells Netr what the plugin is, what it needs, and where to find the code.

### Complete example

```json
{
  "id": "custom-radar",
  "name": "Custom Radar",
  "description": "Overlay proprietary radar imagery on the shared map",
  "category": "environment",
  "icon": "radar",
  "version": "1.2.0",
  "author": "Acme Corp",

  "entry": "./dist/index.js",

  "defaultSize": { "w": 3, "h": 3 },
  "minSize": { "w": 2, "h": 2 },
  "maxSize": { "w": 6, "h": 5 },
  "resizable": true,
  "refreshInterval": 30000,
  "requiresMap": true,

  "permissions": ["http", "cache", "eventBus", "map"],

  "configSchema": {
    "type": "object",
    "properties": {
      "apiKey": {
        "type": "string",
        "title": "API Key",
        "description": "Your radar data provider API key"
      },
      "opacity": {
        "type": "number",
        "title": "Overlay Opacity",
        "default": 0.7,
        "minimum": 0,
        "maximum": 1
      }
    },
    "required": ["apiKey"]
  }
}
```

### Field reference

| Field             | Type              | Required | Description |
|-------------------|-------------------|----------|-------------|
| `id`              | `string`          | yes      | Unique plugin identifier. Must not collide with built-in applet IDs. Use a namespace prefix (e.g., `acme-radar`). |
| `name`            | `string`          | yes      | Human-readable display name. |
| `description`     | `string`          | yes      | Short description for the catalog. |
| `category`        | `AppletCategory`  | yes      | One of: `geo`, `intelligence`, `market`, `infrastructure`, `environment`, `analytics`, `utility`. |
| `icon`            | `string`          | yes      | Lucide icon name or inline SVG string. |
| `entry`           | `string`          | yes      | Relative path (from the manifest URL) to the ESM bundle entry point. |
| `version`         | `string`          | no       | SemVer version string. |
| `author`          | `string`          | no       | Author or organization name. |
| `defaultSize`     | `{ w, h }`        | no       | Default grid size. Falls back to `{ w: 3, h: 3 }`. |
| `minSize`         | `{ w, h }`        | no       | Minimum grid size. Falls back to `{ w: 2, h: 2 }`. |
| `maxSize`         | `{ w, h }`        | no       | Maximum grid size. |
| `resizable`       | `boolean`         | no       | Whether resizable. Falls back to `true`. |
| `refreshInterval` | `number`          | no       | Suggested polling interval in ms. |
| `requiresMap`     | `boolean`         | no       | Whether the plugin publishes map layers. |
| `permissions`     | `string[]`        | no       | List of required permissions (see below). Falls back to `[]`. |
| `configSchema`    | `object`          | no       | JSON Schema for user-configurable settings. |

---

## Building Your Plugin as an ESM Bundle

A plugin is a standard ESM module that exports the same interface as a built-in applet:

```ts
// src/index.tsx
import type { Component } from 'solid-js';
import type { AppletProps, AppletManifest } from 'netr/contract';

export const manifest: AppletManifest = {
  id: 'custom-radar',
  name: 'Custom Radar',
  // ... same as the JSON manifest (the JSON is used for discovery, this for runtime)
};

const CustomRadar: Component<AppletProps> = (props) => {
  // Your applet logic here
  return <div>Radar overlay</div>;
};

export default CustomRadar;
```

### Recommended Vite configuration

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],

  build: {
    // Output as ESM library
    lib: {
      entry: 'src/index.tsx',
      formats: ['es'],
      fileName: 'index',
    },

    // Externalize dependencies provided by the host
    rollupOptions: {
      external: [
        'solid-js',
        'solid-js/web',
        'solid-js/store',
        '@deck.gl/core',
        '@deck.gl/layers',
      ],
      output: {
        // Ensure clean ESM output
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
      },
    },

    // Output directory
    outDir: 'dist',

    // Generate sourcemaps for debugging
    sourcemap: true,

    // Target modern browsers
    target: 'es2022',
  },
});
```

### Project structure

```
my-plugin/
  src/
    index.tsx           <-- entry point (exports manifest + default component)
    helpers.ts          <-- internal helpers
  dist/
    index.js            <-- built ESM bundle
    index.js.map
  netr-plugin.json  <-- manifest
  package.json
  vite.config.ts
```

### Build command

```bash
npm run build
# or
npx vite build
```

After building, deploy `dist/index.js` and `netr-plugin.json` to a publicly accessible URL (CDN, static hosting, or your own server).

---

## Shared Dependencies

The host application provides certain dependencies at runtime. Your plugin must **externalize** these (never bundle them). This keeps plugin bundles small and ensures version compatibility.

| Dependency         | Provided by host | Notes |
|--------------------|------------------|-------|
| `solid-js`         | yes              | Core reactivity and component framework |
| `solid-js/web`     | yes              | DOM renderer |
| `solid-js/store`   | yes              | Store utilities |
| `@deck.gl/core`    | yes              | Deck.gl core |
| `@deck.gl/layers`  | yes              | Standard Deck.gl layer types |

Your plugin may bundle any other dependencies it needs (utility libraries, custom parsers, etc.), but keep the bundle size reasonable. Aim for under 100 KB gzipped.

---

## Permission System

External plugins operate in a scoped environment. The `permissions` array in the manifest declares which host services the plugin needs access to. The user is shown a permission prompt before loading the plugin.

### Available permissions

| Permission   | Grants access to                  | Description |
|--------------|-----------------------------------|-------------|
| `http`       | `services.http`                  | Make HTTP requests through the host's rate-limited, cached fetch wrapper. |
| `cache`      | `services.cache`                 | Read/write to the shared IndexedDB + memory cache. Cache keys are automatically prefixed with the plugin ID to prevent collisions. |
| `eventBus`   | `services.eventBus`              | Subscribe to and emit events on the typed pub/sub bus. |
| `map`        | `services.mapService`            | Register Deck.gl layers on the shared map. |
| `realtime`   | `services.realtime`              | Open WebSocket or SSE connections through the host. |

### Scoped services

When the host loads an external plugin, it creates **scoped wrappers** around the services:

- **HttpService**: Requests are proxied through the host backend to enforce rate limits and prevent CORS issues. The plugin cannot make arbitrary cross-origin requests directly.
- **CacheService**: All cache keys are automatically prefixed with `plugin:{pluginId}:` to prevent one plugin from reading or overwriting another plugin's data.
- **EventBus**: Plugins can listen to all public channels but their emissions are tagged with the plugin ID for audit logging.
- **MapService**: Layers are namespaced under the plugin's instance ID (same as built-in applets).
- **RealtimeService**: WebSocket connections are limited to approved origins. The host may reject connections to unapproved URLs.

### What plugins cannot do

- Access the DOM outside their applet container
- Access `localStorage` or `sessionStorage` directly (use the `cache` service)
- Import internal modules from the host application
- Modify global state or the board configuration
- Access other plugins' cache entries

---

## Loading Plugins by URL

### In the UI

Users can add external plugins through the dashboard settings panel:

1. Open **Settings > Plugins**
2. Paste the URL of the `netr-plugin.json` manifest
3. Review the requested permissions
4. Click **Install**

The plugin appears in the applet catalog with an "External" badge.

### Programmatically

```ts
import { PluginRegistry } from './core/plugin-registry';

const registry = new PluginRegistry();

// Register an external plugin by manifest URL
await registry.registerExternal(
  'https://cdn.example.com/my-plugin/netr-plugin.json'
);

// The plugin is now available in the catalog
const manifests = registry.getManifests();

// Load the plugin when the user adds it to the board
const loader = registry.getLoader('custom-radar');
if (loader) {
  const module = await loader();
  // module.default is the Solid component
  // module.manifest is the runtime manifest
}
```

### How loading works internally

1. `registerExternal(manifestUrl)` fetches the JSON manifest.
2. The manifest is validated (required fields: `id`, `name`, `description`, `category`, `icon`, `entry`).
3. The `entry` path is resolved relative to the manifest URL.
4. A lazy loader function is stored in the registry.
5. When the user adds the applet to the board, the loader calls `import(entryUrl)` to fetch the ESM bundle.
6. The bundle is executed in the browser's module scope. It has access to externalized dependencies (`solid-js`, `@deck.gl/*`) via the host's import map.

---

## Versioning and Updates

### Version field

Include a `version` field in your manifest following SemVer:

```json
{
  "version": "1.2.0"
}
```

### Update strategy

Netr does not auto-update plugins. When you deploy a new version:

1. Update the `version` field in `netr-plugin.json`.
2. Deploy the new `dist/index.js` to the same URL (or a new URL).
3. Users will get the new version on their next page load (the manifest is re-fetched each time).

To ensure cache-busting, use content-hashed filenames:

```ts
// vite.config.ts
output: {
  entryFileNames: 'index-[hash].js',
}
```

Then update the `entry` field in the manifest to point to the new hashed filename.

### Breaking changes

If your plugin changes its persisted state schema, handle migration in the component:

```ts
const [state, setState] = useAppletState(props, {
  version: 2,         // schema version
  filterMode: 'all',  // new field in v2
});

// Migrate from v1
if (!state().version || state().version < 2) {
  setState({ version: 2, filterMode: 'all' });
}
```

---

## Security Considerations

### Code execution

External plugins execute JavaScript in the same browser context as the host. There is no sandboxing (no iframe, no Web Worker). This means a malicious plugin could:

- Read data from other applets via the event bus
- Make network requests (through the scoped HTTP service)
- Access the DOM of its container

**Mitigation:**
- Only install plugins from trusted sources.
- Review the plugin's source code before installing.
- The permission system limits which host services a plugin can access, but it is not a security boundary -- it is a capability declaration.

### Content Security Policy

The host application's CSP must allow `script-src` for the plugin's origin. If you are deploying plugins to a different domain, add it to the CSP:

```
script-src 'self' https://cdn.example.com;
```

### CORS

The plugin's ESM bundle must be served with appropriate CORS headers if hosted on a different origin:

```
Access-Control-Allow-Origin: *
```

or more restrictively:

```
Access-Control-Allow-Origin: https://your-netr-instance.com
```

### Supply chain

- Pin your dependencies in `package-lock.json`.
- Audit dependencies with `npm audit`.
- Consider using Subresource Integrity (SRI) hashes in your deployment pipeline.

---

## Complete Plugin Example

### `netr-plugin.json`

```json
{
  "id": "acme-weather-alerts",
  "name": "ACME Weather Alerts",
  "description": "Proprietary severe weather alerts with polygon overlays",
  "category": "environment",
  "icon": "cloud-lightning",
  "version": "1.0.0",
  "author": "Acme Weather Corp",
  "entry": "./dist/index.js",
  "defaultSize": { "w": 3, "h": 3 },
  "minSize": { "w": 2, "h": 2 },
  "resizable": true,
  "refreshInterval": 60000,
  "requiresMap": true,
  "permissions": ["http", "cache", "eventBus", "map"],
  "configSchema": {
    "type": "object",
    "properties": {
      "apiKey": {
        "type": "string",
        "title": "ACME API Key"
      },
      "region": {
        "type": "string",
        "title": "Region",
        "enum": ["us", "eu", "asia", "global"],
        "default": "global"
      }
    },
    "required": ["apiKey"]
  }
}
```

### `src/index.tsx`

```tsx
import type { Component } from 'solid-js';
import { For, Show, createSignal, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from 'netr/contract';

export const manifest: AppletManifest = {
  id: 'acme-weather-alerts',
  name: 'ACME Weather Alerts',
  description: 'Proprietary severe weather alerts with polygon overlays',
  category: 'environment',
  icon: 'cloud-lightning',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 60000,
  requiresMap: true,
  external: true,
  permissions: ['http', 'cache', 'eventBus', 'map'],
  version: '1.0.0',
  author: 'Acme Weather Corp',
};

interface WeatherAlert {
  id: string;
  title: string;
  severity: 'extreme' | 'severe' | 'moderate' | 'minor';
  area: string;
  lat: number;
  lng: number;
  issuedAt: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  extreme: 'text-red-400',
  severe: 'text-amber-400',
  moderate: 'text-yellow-400',
  minor: 'text-blue-400',
};

const AcmeWeatherAlerts: Component<AppletProps> = (props) => {
  const [alerts, setAlerts] = createSignal<WeatherAlert[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  async function fetchAlerts() {
    try {
      const data = await props.services.http.get<{ alerts: WeatherAlert[] }>(
        'https://api.acmeweather.com/v1/alerts',
        { cacheTtl: 30_000 },
      );
      setAlerts(data.alerts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }

  // Fetch on mount and poll
  fetchAlerts();
  const interval = setInterval(fetchAlerts, 60_000);

  // Publish to event bus
  const sorted = createMemo(() =>
    [...alerts()].sort((a, b) => b.issuedAt - a.issuedAt)
  );

  return (
    <div class="flex flex-col h-full bg-surface-1 text-text-primary">
      <div class="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <h2 class="text-sm font-semibold tracking-wide uppercase">
          Weather Alerts
        </h2>
        <span class="text-xs text-text-secondary">{alerts().length} active</span>
      </div>

      <div class="flex-1 overflow-y-auto min-h-0">
        <Show when={loading()}>
          <div class="flex items-center justify-center h-full text-text-secondary text-sm">
            Loading alerts...
          </div>
        </Show>

        <Show when={!loading() && error()}>
          <div class="flex items-center justify-center h-full text-danger text-sm">
            {error()}
          </div>
        </Show>

        <Show when={!loading() && !error()}>
          <ul class="divide-y divide-border">
            <For each={sorted()}>
              {(alert) => (
                <li class="px-3 py-2.5 hover:bg-surface-2 transition-colors">
                  <div class="flex items-center gap-2">
                    <span class={`text-xs font-bold uppercase ${SEVERITY_COLORS[alert.severity]}`}>
                      {alert.severity}
                    </span>
                    <span class="text-sm truncate">{alert.title}</span>
                  </div>
                  <p class="text-xs text-text-secondary mt-0.5">{alert.area}</p>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>
    </div>
  );
};

export default AcmeWeatherAlerts;
```

### `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  build: {
    lib: {
      entry: 'src/index.tsx',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'solid-js',
        'solid-js/web',
        'solid-js/store',
        '@deck.gl/core',
        '@deck.gl/layers',
      ],
    },
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
  },
});
```

### Deployment

```bash
# Build
npm run build

# Deploy (example with AWS S3 + CloudFront)
aws s3 sync dist/ s3://my-bucket/plugins/acme-weather-alerts/dist/
aws s3 cp netr-plugin.json s3://my-bucket/plugins/acme-weather-alerts/

# The manifest URL to give users:
# https://cdn.example.com/plugins/acme-weather-alerts/netr-plugin.json
```
