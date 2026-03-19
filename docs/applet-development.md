# Building Your First Applet

A step-by-step guide to creating a Netr applet from scratch.

---

## Introduction

An **applet** is a self-contained widget that lives inside the Netr dashboard grid. Each applet is a single Solid.js component that:

- Fetches and displays data (from an API, WebSocket, or the event bus)
- Optionally publishes Deck.gl map layers to the shared map
- Communicates with other applets through a typed event bus
- Persists user preferences so they survive page reloads

In this guide you will build a **Weather Stations** applet that fetches live weather station data from a public API, displays a filterable list of stations, plots them on the map as a scatter layer, and persists the user's chosen filter.

### What you will learn

1. Defining an applet manifest
2. Fetching data with `usePolling`
3. Rendering with SDK components (`AppletShell`, `DataList`, `FilterBar`, `StatGrid`)
4. Publishing a Deck.gl map layer with `useMapLayer`
5. Communicating with other applets via `useEventBus`
6. Persisting state with `useAppletState`
7. Registering the applet in the built-in registry

---

## Prerequisites

- **Solid.js fundamentals** -- signals (`createSignal`), derived state (`createMemo`), effects (`createEffect`), JSX, and lifecycle hooks (`onMount`, `onCleanup`).
- **TypeScript** -- you will write `.tsx` files with typed interfaces.
- **Basic understanding of the dashboard shell** -- the shell manages the grid layout, injects services into applets, and coordinates the shared map.

You do not need to know Deck.gl or MapLibre to follow this guide; the SDK layer factories handle the complexity.

---

## Development Environment Setup

You can develop applets using either Docker (recommended) or a native Node installation.

### Option A: Docker

```bash
git clone https://github.com/hakaitech/netr.git
cd netr
docker compose up
```

This starts two containers:

| Service | Port | What it does |
|---------|------|--------------|
| `frontend-dev` | `5173` | Vite dev server with HMR — edits to `src/` reflect instantly |
| `api` | `8787` | Hono backend with tsx watch — edits to `server/src/` auto-restart |

Source directories are bind-mounted into the containers, so you edit files on your host machine and changes are picked up immediately — no rebuild required.

**Common commands:**

```bash
# Start in background
docker compose up -d

# View frontend logs
docker compose logs -f frontend-dev

# View API logs
docker compose logs -f api

# Rebuild after changing package.json
docker compose up --build

# Stop everything
docker compose down
```

### Option B: Native Node

Requires **Node 22+** and **npm 10+**.

```bash
git clone https://github.com/hakaitech/netr.git
cd netr

# Install all dependencies
npm install
cd server && npm install && cd ..

# Terminal 1 — start the API server
cd server && npm run dev:node

# Terminal 2 — start the frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite dev server proxies `/api/*` requests to the backend on port 8787.

### Verifying your setup

Once running, you should see:

1. The Netr dashboard at [localhost:5173](http://localhost:5173) with a dark theme
2. The GEOINT Dashboard preset loaded by default with Live Map, Live News, Earthquakes, and Flight Tracker
3. The "Add Applet" button in the top bar opens the catalog showing 52 applets
4. Live data flowing — earthquake dots on the map (from USGS), news articles updating

If the map shows "Loading map..." indefinitely, check that port 5173 is not blocked and that the Vite proxy is forwarding `/api` to the backend.

---

## Step 1: Create the File

Every applet lives in its own directory under `src/applets/`. The entry point must be `index.tsx`.

```
src/applets/
  earthquake-feed/
    index.tsx          <-- existing applet
  flight-tracker/
    index.tsx          <-- existing applet
  weather-stations/
    index.tsx          <-- YOUR NEW APPLET
```

Create the file:

```
src/applets/weather-stations/index.tsx
```

The file **must** export exactly two things:

| Export    | Type                        | Purpose                     |
|-----------|-----------------------------|-----------------------------|
| `manifest`| `AppletManifest`           | Static metadata for the catalog and grid |
| `default` | `Component<AppletProps>`   | The Solid component that renders the applet |

```ts
import type { Component } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';

export const manifest: AppletManifest = { /* ... */ };

const WeatherStations: Component<AppletProps> = (props) => {
  return <div>Hello, World!</div>;
};

export default WeatherStations;
```

---

## Step 2: Define the Manifest

The manifest is a plain object that describes your applet to the catalog, the grid layout engine, and the plugin system.

```ts
export const manifest: AppletManifest = {
  id: 'weather-stations',
  name: 'Weather Stations',
  description: 'Live weather station observations from global networks',
  category: 'environment',
  icon: 'thermometer',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 6, h: 5 },
  resizable: true,
  refreshInterval: 120000,
  requiresMap: true,
};
```

### Field reference

| Field             | Type              | Required | Description |
|-------------------|-------------------|----------|-------------|
| `id`              | `string`          | yes      | Unique slug. Must match the directory name. Use lowercase with hyphens. |
| `name`            | `string`          | yes      | Human-readable title shown in the catalog and the applet header. |
| `description`     | `string`          | yes      | One-line description shown in the catalog card. |
| `category`        | `AppletCategory`  | yes      | One of `'geo'`, `'intelligence'`, `'market'`, `'infrastructure'`, `'environment'`, `'analytics'`, `'utility'`. Controls which tab the applet appears in. |
| `icon`            | `string`          | yes      | A Lucide icon name (e.g., `'thermometer'`, `'plane'`, `'activity'`). |
| `defaultSize`     | `GridSize`        | yes      | `{ w, h }` -- columns and rows when first placed on the board. |
| `minSize`         | `GridSize`        | yes      | Minimum resize boundary. |
| `maxSize`         | `GridSize`        | no       | Maximum resize boundary. Omit for unlimited. |
| `resizable`       | `boolean`         | yes      | Whether the user can drag-resize the applet. |
| `refreshInterval` | `number`          | no       | Suggested polling interval in milliseconds. Shown in the catalog. Set `undefined` for event-driven or push-based applets. |
| `requiresMap`     | `boolean`         | no       | Set `true` if the applet publishes Deck.gl layers. The shell uses this to warn users if no map applet is on the board. |
| `external`        | `boolean`         | no       | Reserved for the plugin system. Do not set this on built-in applets. |
| `permissions`     | `string[]`        | no       | Reserved for external plugins. |
| `configSchema`    | `Record<string, unknown>` | no | JSON Schema for user-configurable settings. |
| `version`         | `string`          | no       | SemVer version string, mainly for external plugins. |
| `author`          | `string`          | no       | Author name, mainly for external plugins. |

---

## Step 3: Build the Component

Your component receives `AppletProps`, which gives you access to everything you need:

```ts
export interface AppletProps {
  services: AppletServices;  // injected services
  instanceId: string;        // unique per placement on board
  width: number;             // current container width in pixels
  height: number;            // current container height in pixels
  initialState?: Record<string, unknown>;   // restored persisted state
  onStateChange?: (state: Record<string, unknown>) => void;  // persist callback
}
```

The `services` object contains five services:

| Service          | Type              | What it does |
|------------------|-------------------|--------------|
| `services.http`  | `HttpService`     | Rate-limited, cached HTTP fetch wrapper with request deduplication |
| `services.eventBus` | `EventBus`    | Typed pub/sub for cross-applet communication |
| `services.mapService` | `MapService` | Register/remove Deck.gl layers on the shared map |
| `services.cache` | `CacheService`    | IndexedDB + in-memory key-value cache |
| `services.realtime` | `RealtimeService` | WebSocket + SSE connection manager with auto-reconnect |

You rarely use these services directly. Instead, the SDK provides **hooks** that wrap them with reactivity and auto-cleanup.

```ts
import {
  usePolling,
  useMapLayer,
  useEventBus,
  useAppletState,
  useFilter,
  AppletShell,
  DataList,
  FilterBar,
  StatGrid,
  createScatterLayer,
  formatNumber,
  colorScale,
} from '../../sdk';
```

---

## Step 4: Fetch Data

### Interval-based fetching with `usePolling`

The most common pattern is polling an API at a fixed interval. The `usePolling` hook handles this, including loading state, error state, and automatic cleanup when the component unmounts.

```ts
interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  tempC: number;
  humidity: number;
  type: string;
}

interface ApiResponse {
  stations: Station[];
}

const { data, loading, error, refresh } = usePolling<Station[], ApiResponse>(
  () => props.services.http.get<ApiResponse>('/api/weather/stations', {
    cacheTtl: 60_000,
  }),
  120_000,  // poll every 2 minutes
  {
    immediate: true,           // fetch on mount (default)
    transform: (raw) => raw.stations,  // extract the array from the response
    onSuccess: (stations) => {
      console.log(`Got ${stations.length} stations`);
    },
  },
);
```

**Key points:**

- `data()` returns `Station[] | null`. It is `null` until the first successful fetch.
- `loading()` is `true` during the initial fetch, then `false`.
- `error()` is `null` on success, or a string error message on failure.
- `refresh()` manually triggers a fetch outside the interval.
- The interval is automatically cleared when the component unmounts. You do not need `onCleanup`.

### One-time fetches

For data you only need once (e.g., a configuration endpoint), call `http.get` directly inside `onMount`:

```ts
import { onMount, createSignal } from 'solid-js';

const [config, setConfig] = createSignal<Config | null>(null);

onMount(async () => {
  const data = await props.services.http.get<Config>('/api/config');
  setConfig(data);
});
```

### Handling loading and error states

The SDK provides `LoadingState` and `ErrorState` components, but you do not need them directly when using `DataList` -- it handles all three states (loading, error, empty) automatically.

---

## Step 5: Render the UI

### AppletShell -- the standard frame

Every applet should use `AppletShell` as its outermost wrapper. It provides the header bar, status indicator, optional toolbar area, and a scrollable body.

```tsx
<AppletShell
  title="Weather Stations"
  status="connected"             // 'connected' | 'error' | 'loading' | 'warning'
  statusText="Live"              // text next to the status dot
  headerRight={<MyDropdown />}   // rendered in the header's right side
  toolbar={<FilterBar ... />}    // rendered between header and body
>
  {/* scrollable body content goes here */}
</AppletShell>
```

**Props:**

| Prop          | Type                                        | Description |
|---------------|---------------------------------------------|-------------|
| `title`       | `string`                                    | Displayed as uppercase text in the header |
| `status`      | `'connected' \| 'error' \| 'loading' \| 'warning'` | Controls the color of the status dot |
| `statusText`  | `string`                                    | Optional label next to the status dot |
| `headerRight` | `JSX.Element`                               | Custom content in the header's right side |
| `toolbar`     | `JSX.Element`                               | Content between the header and the scroll area |
| `children`    | `JSX.Element`                               | The scrollable body |

### DataList -- scrollable lists with state handling

`DataList` renders a list of items and automatically shows loading, error, and empty states.

```tsx
<DataList
  items={filtered}
  loading={loading}
  error={error}
  emptyMessage="No stations found"
  loadingMessage="Fetching weather data..."
  onRetry={refresh}
  renderItem={(station, index) => (
    <div class="flex items-center gap-3 px-3 py-2 hover:bg-surface-2 transition-colors">
      <span class="text-sm font-semibold">{station.name}</span>
      <span class="text-xs text-text-secondary">{station.tempC}C</span>
    </div>
  )}
/>
```

### StatGrid -- numeric statistics

`StatGrid` renders a grid of labeled numbers, useful for summary stats above the main list.

```tsx
<StatGrid
  columns={3}
  stats={[
    { label: 'Stations', value: formatNumber(data()?.length ?? 0) },
    { label: 'Avg Temp', value: `${avgTemp()}C`, color: 'text-amber-400' },
    { label: 'Countries', value: countryCount() },
  ]}
/>
```

### FilterBar -- category pill filters

`FilterBar` renders a row of pill-shaped buttons for filtering.

```tsx
<FilterBar
  options={['All', 'Airport', 'Marine', 'Urban', 'Mountain']}
  value={filter}
  onChange={setFilter}
/>
```

### Tailwind design tokens

Netr uses custom Tailwind tokens for consistent dark-theme styling. **Always use these tokens instead of raw Tailwind colors** so your applet works with any theme.

| Token              | Purpose                                  |
|--------------------|------------------------------------------|
| `bg-surface-0`     | Deepest background (the page)            |
| `bg-surface-1`     | Applet card background                   |
| `bg-surface-2`     | Hover/secondary background               |
| `bg-surface-3`     | Active/pressed background                |
| `text-text-primary` | Primary text color                      |
| `text-text-secondary` | Muted/secondary text                  |
| `border-border`    | Borders and dividers                     |
| `bg-accent`        | Accent/brand color (buttons, active pills) |
| `text-accent`      | Accent-colored text                      |
| `bg-danger` / `text-danger` | Error/destructive color          |
| `bg-warning` / `text-warning` | Warning color                  |

Example pattern for a list item:

```tsx
<div class="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-2 transition-colors border-b border-border">
  <span class="text-sm text-text-primary">{item.name}</span>
  <span class="text-xs text-text-secondary">{item.detail}</span>
</div>
```

---

## Step 6: Add Map Layers (Optional)

If your applet works with geographic data, you can publish Deck.gl layers to the shared map. Multiple applets can publish layers simultaneously -- the MapService composites them.

### Using the `useMapLayer` hook

`useMapLayer` reactively tracks your layer factory function and registers/removes layers automatically.

```ts
import { useMapLayer, createScatterLayer, colorScale } from '../../sdk';

useMapLayer(props, () => {
  const stations = data();
  if (!stations || stations.length === 0) return null;

  return [
    createScatterLayer(`${props.instanceId}-stations`, stations, {
      getPosition: (d: Station) => [d.lng, d.lat],
      getRadius: (d: Station) => Math.max(d.tempC * 200, 500),
      getFillColor: (d: Station) =>
        colorScale(d.tempC, -20, 45, [
          [59, 130, 246, 200],   // cold: blue
          [250, 204, 21, 200],   // warm: yellow
          [239, 68, 68, 200],    // hot: red
        ]),
      radiusMinPixels: 4,
      radiusMaxPixels: 30,
    }),
  ];
});
```

**Key points:**

- The factory function runs inside a `createEffect`, so it re-runs whenever any signal it reads changes (e.g., `data()`, `filter()`).
- Return `null` or an empty array to remove all layers.
- Layers are automatically removed when the component unmounts.
- Always prefix layer IDs with `props.instanceId` to avoid collisions when multiple instances of the same applet exist.

### Available layer factories

| Factory                | Deck.gl Layer      | Use case |
|------------------------|--------------------|----------|
| `createScatterLayer`   | `ScatterplotLayer` | Point data (earthquakes, stations, aircraft) |
| `createPathLayer`      | `PathLayer`        | Routes, tracks, trajectories |
| `createArcLayer`       | `ArcLayer`         | Origin-destination arcs (trade flows, migrations) |
| `createGeoJsonLayer`   | `GeoJsonLayer`     | GeoJSON polygons, lines, points |

All factories come with dark-theme-friendly defaults (indigo fill, 0.8 opacity, pickable).

---

## Step 7: Cross-Applet Communication

Applets communicate through the **EventBus**, a typed pub/sub system with microtask batching.

### Subscribing and emitting with `useEventBus`

```ts
import { useEventBus } from '../../sdk';

// Subscribe to earthquake updates from the earthquake applet
const { emit } = useEventBus(props, 'earthquake:update', (quakes) => {
  // React to earthquake data -- e.g., highlight nearby stations
  const nearby = findNearbyStations(data(), quakes);
  setHighlighted(nearby);
});

// Emit your own data on a channel
emit(myData);
```

The subscription is automatically removed when the component unmounts.

### Available event channels

These are the typed channels defined in `EventChannelMap`:

| Channel                | Payload                                  | Publisher |
|------------------------|------------------------------------------|-----------|
| `earthquake:new`       | `Earthquake`                             | Earthquake Monitor |
| `earthquake:update`    | `Earthquake[]`                           | Earthquake Monitor |
| `news:breaking`        | `NewsItem`                               | Live News |
| `news:update`          | `NewsItem[]`                             | Live News |
| `aircraft:update`      | `Aircraft[]`                             | Flight Tracker |
| `map:viewstate`        | `ViewState`                              | Live Map |
| `map:click`            | `{ lat, lng, object? }`                  | Live Map |
| `theme:change`         | `'dark' \| 'light'`                      | Shell |
| `board:applet-added`   | `{ appletId, instanceId }`               | Shell |
| `board:applet-removed` | `{ instanceId }`                         | Shell |
| `applet:visibility`    | `{ instanceId, visible }`                | Shell |

### Best practices

- **Do not flood the bus.** Emit at most once per data-fetch cycle. The bus coalesces multiple emissions in the same synchronous block into one delivery per channel.
- **Keep payloads small.** If you have 10,000 items, emit a summary or the top-N, not the full array.
- **Handle missing publishers.** Your handler might never fire if the publishing applet is not on the board.

---

## Step 8: Persist State

Use `useAppletState` to save user preferences (selected filter, sort order, configuration) that survive page reloads and board saves.

```ts
import { useAppletState } from '../../sdk';

const [state, setState] = useAppletState(props, {
  filter: 'All',
  sortBy: 'name',
  showInactive: false,
});

// Read state reactively
const currentFilter = () => state().filter;

// Update state -- this notifies the shell, which persists it
setState({ filter: 'Airport' });
```

**How it works:**

1. `useAppletState` merges your `defaults` with any `initialState` restored from the board config.
2. Every call to `setState` updates the local signal **and** calls `props.onStateChange(...)`, which tells the shell to persist the new state.
3. When the user saves the board (or the board auto-saves), the state is written to IndexedDB as part of the `BoardConfig`.

**What to persist:** Filter selections, sort preferences, collapsed/expanded sections, user-entered configuration (API keys, thresholds). **What not to persist:** Fetched data, loading state, transient UI state.

---

## Step 9: Register the Applet

### For built-in applets

Open `src/core/builtin-registry.ts` and add your applet.

First, import or define the manifest constant:

```ts
const WEATHER_STATIONS_MANIFEST: AppletManifest = {
  id: 'weather-stations',
  name: 'Weather Stations',
  description: 'Live weather station observations from global networks',
  category: 'environment',
  icon: 'thermometer',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 120000,
  requiresMap: true,
};
```

Then register it in the `createBuiltinRegistry` function:

```ts
registry.registerBuiltin(
  'weather-stations',
  WEATHER_STATIONS_MANIFEST,
  () => import('../applets/weather-stations') as Promise<AppletModule>,
);
```

The dynamic `import()` ensures the applet code is only loaded when the user adds it to the board (code splitting).

### For external plugins

See the [External Plugin Guide](./plugin-system.md) for building, packaging, and distributing plugins loaded by URL.

---

## Complete Example

Here is a full applet that fetches weather station data, renders a filtered list with stats, publishes a scatter layer to the map, listens for map clicks, and persists the filter state.

```tsx
// src/applets/weather-stations/index.tsx

import type { Component } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  usePolling,
  useMapLayer,
  useEventBus,
  useAppletState,
  useFilter,
  AppletShell,
  DataList,
  FilterBar,
  StatGrid,
  createScatterLayer,
  formatNumber,
  colorScale,
} from '../../sdk';

// -- Manifest ----------------------------------------------------------------

export const manifest: AppletManifest = {
  id: 'weather-stations',
  name: 'Weather Stations',
  description: 'Live weather station observations from global networks',
  category: 'environment',
  icon: 'thermometer',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 120_000,
  requiresMap: true,
};

// -- Types -------------------------------------------------------------------

interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  tempC: number;
  humidity: number;
  type: string; // 'Airport' | 'Marine' | 'Urban' | 'Mountain'
}

interface ApiResponse {
  stations: Station[];
}

// -- Component ---------------------------------------------------------------

const WeatherStations: Component<AppletProps> = (props) => {
  // Persisted state
  const [state, setState] = useAppletState(props, {
    filterType: 'All',
  });

  // Polling
  const { data, loading, error, refresh } = usePolling<Station[], ApiResponse>(
    () => props.services.http.get<ApiResponse>('/api/weather/stations', {
      cacheTtl: 60_000,
    }),
    120_000,
    { transform: (raw) => raw.stations },
  );

  // Filtering
  const allItems = () => data() ?? [];
  const { filtered, filter, setFilter } = useFilter(
    allItems,
    (station, f) => station.type === f,
    state().filterType,
  );

  // Sync filter to persisted state
  const handleFilterChange = (f: string) => {
    setFilter(f);
    setState({ filterType: f });
  };

  // Derived stats
  const avgTemp = () => {
    const items = filtered();
    if (items.length === 0) return '--';
    const sum = items.reduce((acc, s) => acc + s.tempC, 0);
    return `${(sum / items.length).toFixed(1)}C`;
  };

  // Map layer
  useMapLayer(props, () => {
    const stations = filtered();
    if (stations.length === 0) return null;
    return [
      createScatterLayer(`${props.instanceId}-stations`, stations, {
        getPosition: (d: Station) => [d.lng, d.lat],
        getRadius: (d: Station) => Math.max(Math.abs(d.tempC) * 300, 800),
        getFillColor: (d: Station) =>
          colorScale(d.tempC, -20, 45, [
            [59, 130, 246, 200],
            [250, 204, 21, 200],
            [239, 68, 68, 200],
          ]),
        radiusMinPixels: 4,
        radiusMaxPixels: 30,
      }),
    ];
  });

  // Listen for map clicks
  useEventBus(props, 'map:click', (event) => {
    console.log('Map clicked at', event.lat, event.lng);
  });

  // Status
  const status = () => {
    if (loading()) return 'loading' as const;
    if (error()) return 'error' as const;
    return 'connected' as const;
  };

  return (
    <AppletShell
      title="Weather Stations"
      status={status()}
      statusText={error() ?? `${filtered().length} stations`}
      toolbar={
        <>
          <StatGrid
            columns={3}
            stats={[
              { label: 'Total', value: formatNumber(allItems().length) },
              { label: 'Showing', value: formatNumber(filtered().length) },
              { label: 'Avg Temp', value: avgTemp(), color: 'text-amber-400' },
            ]}
          />
          <FilterBar
            options={['All', 'Airport', 'Marine', 'Urban', 'Mountain']}
            value={filter}
            onChange={handleFilterChange}
          />
        </>
      }
    >
      <DataList
        items={filtered}
        loading={loading}
        error={error}
        emptyMessage="No stations match the current filter"
        loadingMessage="Fetching station data..."
        onRetry={refresh}
        renderItem={(station) => (
          <div class="flex items-center justify-between px-3 py-2.5 hover:bg-surface-2 transition-colors">
            <div class="min-w-0 flex-1">
              <p class="text-sm truncate">{station.name}</p>
              <p class="text-xs text-text-secondary">{station.type}</p>
            </div>
            <div class="text-right shrink-0 ml-3">
              <p class="text-sm font-bold tabular-nums">{station.tempC}C</p>
              <p class="text-xs text-text-secondary">{station.humidity}%</p>
            </div>
          </div>
        )}
      />
    </AppletShell>
  );
};

export default WeatherStations;
```

This applet is approximately 110 lines and demonstrates every major SDK feature.

---

## Checklist

Before shipping your applet, verify each item:

- [ ] Single file in `src/applets/{id}/index.tsx`
- [ ] Exports `manifest` (named) and `default` (default export)
- [ ] Uses `AppletShell` for consistent framing
- [ ] Handles loading, error, and empty states (via `DataList` or manually)
- [ ] Cleans up intervals and map layers on unmount (SDK hooks do this automatically)
- [ ] Uses Tailwind design tokens (`surface-0/1/2/3`, `text-primary/secondary`, `border`, `accent`) -- no custom hex colors
- [ ] No global state mutations -- all state is local signals or `useAppletState`
- [ ] No DOM manipulation outside the applet container
- [ ] Layer IDs are prefixed with `props.instanceId`
- [ ] Event bus emissions are throttled to one per fetch cycle
- [ ] Registered in `builtin-registry.ts` with a dynamic `import()`
