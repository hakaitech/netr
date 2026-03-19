# System Architecture

High-level architecture overview for Netr contributors. This document describes how the major subsystems connect and how data flows from external APIs through to the rendered UI and map layers.

---

## System Diagram

```
+-----------------------------------------------------------------------+
|                         BROWSER                                        |
|                                                                        |
|  +---------------------------+    +--------------------------------+   |
|  |    Dashboard Shell        |    |       Shared Map (Deck.gl)     |   |
|  |  (GridStack layout)       |    |       + MapLibre base tiles    |   |
|  |                           |    |                                |   |
|  |  +-------+ +-------+     |    |   Layers from all applets      |   |
|  |  |Applet | |Applet |     |    |   composited into one scene    |   |
|  |  |  A    | |  B    | ... |    |                                |   |
|  |  +---+---+ +---+---+     |    +----------+---------------------+   |
|  |      |          |        |               ^                          |
|  +------+----------+--------+               |                          |
|         |          |                        |                          |
|         v          v                        |                          |
|  +------+----------+--------+    +----------+---------------------+   |
|  |      Service Layer       +--->+       MapService               |   |
|  |                          |    |  setLayers() / removeLayers()  |   |
|  |  EventBus                |    +--------------------------------+   |
|  |  HttpService             |                                          |
|  |  CacheService            |                                          |
|  |  RealtimeService         |                                          |
|  +-----------+--------------+                                          |
|              |                                                         |
+-----------------------------------------------------------------------+
               |
               | fetch / WebSocket / SSE
               v
+-----------------------------------------------------------------------+
|                    Backend (Hono)                                       |
|                                                                        |
|  /api/proxy/:url     -- proxied external API calls                     |
|  /api/news           -- aggregated RSS feeds                           |
|  /api/weather/*      -- weather data endpoints                         |
|  /api/cache/*        -- server-side caching middleware                  |
+-----------------------------------------------------------------------+
               |
               v
       External APIs (USGS, OpenSky, RSS feeds, etc.)
```

---

## Dashboard Shell

The shell is the outermost layer of the application. It manages:

- **Grid layout** via GridStack. Applets are placed in a responsive column grid with configurable row height and gap. The default configuration is 12 columns.
- **Applet lifecycle**: loading applet modules, mounting/unmounting components, injecting services, and passing props.
- **Board persistence**: saving and restoring the board configuration (applet placements, positions, and per-applet state) to IndexedDB.
- **Catalog UI**: browsing available applets by category and adding them to the board.

### Component hierarchy

```
App
  +-- Shell
        +-- Header (board name, preset selector, settings)
        +-- GridStack container
        |     +-- GridItem (per applet placement)
        |           +-- AppletWrapper
        |                 +-- <Suspense>
        |                       +-- Applet Component (lazy-loaded)
        +-- Catalog drawer (browse & add applets)
        +-- Settings panel (plugins, theme, export/import)
```

Each `AppletWrapper` is responsible for:

1. Calling `registry.getLoader(appletId)` to get the lazy import function.
2. Loading the module inside a `Suspense` boundary.
3. Constructing the `AppletProps` object with injected services, instanceId, dimensions, and restored state.
4. Rendering the applet component.
5. Listening for `onStateChange` callbacks and writing the new state back to the board config.

---

## Applet Contract

Every applet -- built-in or external -- conforms to the `AppletModule` interface:

```
AppletModule
  +-- manifest: AppletManifest    (static metadata)
  +-- default: Component<AppletProps>  (the Solid.js component)
```

### AppletManifest

Describes the applet to the catalog and the grid:

```
AppletManifest
  id            string           Unique identifier
  name          string           Display name
  description   string           Catalog description
  category      AppletCategory   Grouping: geo | intelligence | market | ...
  icon          string           Lucide icon name
  defaultSize   { w, h }         Initial grid size
  minSize       { w, h }         Minimum resize boundary
  maxSize?      { w, h }         Maximum resize boundary
  resizable     boolean          Whether drag-resizable
  refreshInterval?  number       Suggested poll interval (ms)
  requiresMap?  boolean          Whether it publishes map layers
  external?     boolean          Whether loaded from external URL
  permissions?  string[]         Required permissions (external only)
  configSchema? object           JSON Schema for settings
  version?      string           SemVer (external only)
  author?       string           Author (external only)
```

### AppletProps

The props injected into every applet component:

```
AppletProps
  services        AppletServices   Injected service instances
  instanceId      string           Unique per placement (allows duplicates)
  width           number           Current container width (px)
  height          number           Current container height (px)
  initialState?   Record           Restored persisted state from board config
  onStateChange?  (state) => void  Callback to persist state
```

### AppletServices

```
AppletServices
  eventBus        EventBus         Typed pub/sub
  mapService      MapService       Deck.gl layer management
  http            HttpService      Rate-limited cached HTTP
  cache           CacheService     IndexedDB + memory cache
  realtime        RealtimeService  WebSocket + SSE
```

---

## Service Layer

All services are singletons instantiated by the shell at startup and shared across all applets.

### EventBus

A typed publish/subscribe system with microtask batching.

**Key design decisions:**

- **Typed channels**: The `EventChannelMap` interface defines every legal channel and its payload type. TypeScript enforces correct usage at compile time.
- **Microtask coalescing**: Multiple `emit()` calls within the same synchronous block are batched. Only the latest value per channel is delivered, and handlers fire once per channel per microtask flush. This prevents cascading re-renders when several applets emit in response to the same data.
- **Safe iteration**: Handlers are iterated over a snapshot array, so unsubscriptions during handler execution are safe.
- **Error isolation**: If a handler throws, the error is caught and logged. Other handlers on the same channel still execute.

```
emit('earthquake:update', [...])
  |
  +-- pending.set('earthquake:update', data)
  +-- scheduleFlush()  (queueMicrotask, only if not already scheduled)
  |
  ...synchronous code continues...
  |
  +-- [microtask fires]
        +-- flush()
              +-- for each (channel, data) in pending:
                    +-- for each handler in listeners[channel]:
                          handler(data)
```

### MapService

Manages the shared Deck.gl layer pool. Every applet that publishes map layers calls `setLayers(ownerId, layers)` to register or update its layers. The MapService composites all layers from all applets and pushes them to the Deck.gl instance.

**Key design decisions:**

- **Owner-keyed storage**: Layers are stored in a `Map<string, Layer[]>` keyed by owner ID (the applet's `instanceId`). Each applet can only modify its own layers.
- **Microtask coalescing**: Like the EventBus, rapid-fire `setLayers`/`removeLayers` calls are coalesced into a single notification per microtask tick.
- **Insertion-order composition**: Layers are flattened in Map insertion order (oldest owner first), so the most recently added applet's layers render on top.

```
Applet A: setLayers('a', [scatterLayer])
Applet B: setLayers('b', [arcLayer])
Applet C: setLayers('c', [pathLayer, geoJsonLayer])
  |
  v
MapService.getAllLayers() = [scatterLayer, arcLayer, pathLayer, geoJsonLayer]
  |
  v
Deck.gl instance re-renders with all 4 layers
```

### HttpService

A fetch wrapper with three features:

1. **Request deduplication**: If an identical GET is already in-flight, the existing promise is returned instead of issuing a duplicate.
2. **TTL caching**: Successful GET responses can be cached in memory with a configurable TTL.
3. **Timeout**: Every request has a configurable timeout (default 15 seconds) via `AbortController`.

POST requests are never deduplicated or cached.

### CacheService

A two-tier cache (in-memory Map + IndexedDB via `idb-keyval`):

1. **Read path**: Check in-memory first. If not found or expired, fall back to IndexedDB. If found in IndexedDB, promote to memory.
2. **Write path**: Write to both tiers simultaneously.
3. **TTL expiry**: Entries have an optional TTL. Expired entries are lazily cleaned up on read. A `prune()` method can be called periodically for memory reclamation.
4. **Graceful degradation**: If IndexedDB is unavailable (private browsing, quota exceeded), the memory tier still works.

### RealtimeService

Manages WebSocket and SSE connections:

- **WebSocket**: `connectWs(url)` opens a connection. Messages are expected as JSON envelopes: `{ channel: string, data: unknown }`. Channel-based subscription via `onWsMessage(channel, handler)`. Auto-reconnect with exponential backoff (1s to 30s).
- **SSE**: `connectSse(url)` opens an EventSource. Event-type-based subscription via `onSseEvent(eventType, handler)`. The browser handles reconnection natively.
- Both connection types support clean shutdown via `disconnect()`.

---

## Plugin Registry

The `PluginRegistry` is the central catalog of all available applets.

```
PluginRegistry
  +-- registered: Map<string, RegisteredApplet>
  |
  +-- registerBuiltin(id, manifest, loader)    -- for built-in applets
  +-- registerExternal(manifestUrl)            -- for external plugins
  +-- getManifests()                           -- all manifests (for catalog)
  +-- getManifestsByCategory(category)         -- filtered manifests
  +-- getLoader(appletId)                      -- get the lazy loader function
  +-- has(appletId)                            -- existence check
  +-- isExternal(appletId)                     -- built-in vs external
```

### Built-in vs external

| Aspect        | Built-in                                | External                                  |
|---------------|------------------------------------------|-------------------------------------------|
| Registration  | `registerBuiltin()` in `builtin-registry.ts` | `registerExternal(manifestUrl)` at runtime |
| Loading       | Vite dynamic `import()`                  | Runtime `import()` of a remote ESM URL    |
| Manifest      | Defined in TypeScript                    | Fetched from JSON over HTTP               |
| Permissions   | Full access to all services              | Scoped by declared permissions            |
| Bundling      | Code-split by Vite                       | Independent ESM bundle                    |

### Dynamic loading flow

```
User adds applet to board
  |
  v
Shell calls registry.getLoader('earthquake-feed')
  |
  v
Loader returns: () => import('../applets/earthquake-feed')
  |
  v
Vite loads the chunk (or browser fetches the external ESM URL)
  |
  v
Module is resolved: { default: Component, manifest: AppletManifest }
  |
  v
Shell mounts the component inside a GridItem with injected props
```

---

## Data Flow

The typical data flow for a polling applet:

```
1. onMount
     |
     v
2. usePolling starts interval
     |
     v
3. fetcher() calls http.get(url, { cacheTtl })
     |
     +-- HttpService checks in-memory cache
     |     +-- HIT:  return cached data
     |     +-- MISS: check inflight map
     |                +-- HIT:  return existing promise (dedup)
     |                +-- MISS: fetch(url) with AbortController timeout
     |                           +-- response.json()
     |                           +-- write to cache
     |                           +-- return data
     v
4. transform(rawData) extracts desired shape
     |
     v
5. setData(result) updates the Solid signal
     |
     +-- triggers re-render of DataList (or other reactive consumers)
     |
     +-- triggers createEffect inside useMapLayer
     |     |
     |     v
     |   layerFactory() builds new Deck.gl layers
     |     |
     |     v
     |   mapService.setLayers(instanceId, layers)
     |     |
     |     v
     |   [microtask] mapService notifies Deck.gl to re-render all layers
     |
     +-- onSuccess callback (optional)
           |
           v
         eventBus.emit('my-channel', data)
           |
           v
         [microtask] other applets' handlers fire
```

---

## Event System

### Typed channels

All event channels are defined in `EventChannelMap` (`src/core/types.ts`). Adding a new channel requires adding a new entry to this interface:

```ts
export interface EventChannelMap {
  'earthquake:new': Earthquake;
  'earthquake:update': Earthquake[];
  'news:breaking': NewsItem;
  // ... add new channels here
}
```

TypeScript enforces that `emit('earthquake:update', data)` receives an `Earthquake[]` and that `on('earthquake:update', handler)` receives the correct type in the handler.

### Microtask batching

```
Time ──────────────────────────────────────────>

  emit('a', v1)  emit('a', v2)  emit('b', v3)
       |              |              |
       +-- pending: { a: v1 }       |
                      |              |
                      +-- pending: { a: v2 }   (v1 overwritten)
                                     |
                                     +-- pending: { a: v2, b: v3 }
                                     |
                                     +-- scheduleFlush (already scheduled, no-op)
  ─────────────────────── microtask boundary ───────────────────────
                                     |
                                     v
                                   flush()
                                     +-- handlers for 'a' receive v2 (not v1)
                                     +-- handlers for 'b' receive v3
```

This means if an applet emits the same channel multiple times in one synchronous block (e.g., in a loop), only the final value is delivered. This is intentional -- it prevents thundering-herd effects when multiple data sources update simultaneously.

---

## Map Architecture

### Shared Deck.gl instance

There is a single Deck.gl instance managed by the `deck-map` applet. It renders on top of a MapLibre GL JS base map. The map applet:

1. Initializes the `DeckGL` and `maplibregl.Map` instances.
2. Calls `mapService.setLayerChangeHandler(callback)` to receive layer updates.
3. Whenever any applet calls `mapService.setLayers(...)` or `mapService.removeLayers(...)`, the callback fires with the full flattened layer array.
4. The Deck.gl instance re-renders with the new layer array.

### Layer composition

```
+---------------------------------------------------+
|                  Deck.gl Viewport                   |
|                                                     |
|  Layer stack (bottom to top):                       |
|    [0] earthquake-feed scatter layer                |
|    [1] flight-tracker scatter layer                 |
|    [2] custom-plugin path layer                     |
|    [3] custom-plugin geojson layer                  |
|                                                     |
|  Base map: MapLibre GL (Dark style)                 |
+---------------------------------------------------+
```

Layers from different applets do not interfere with each other. Each applet manages its own set of layers via the `useMapLayer` hook, which handles the `setLayers`/`removeLayers` lifecycle.

### Layer ID conventions

Layer IDs must be globally unique. The convention is:

```
{instanceId}-{layerName}
```

For example: `abc123-earthquakes`, `abc123-aircraft`. Since `instanceId` is unique per placement, even two instances of the same applet produce unique layer IDs.

---

## Board Persistence

### Storage

Board configurations are stored in **IndexedDB** via the `idb-keyval` library. The data model:

```ts
interface BoardConfig {
  id: string;           // unique board ID
  name: string;         // user-visible board name
  columns: number;      // grid column count (default 12)
  rowHeight: number;    // row height in pixels
  gap: number;          // gap between grid items in pixels
  applets: AppletPlacement[];  // list of placed applets
  createdAt: number;    // creation timestamp
  updatedAt: number;    // last modification timestamp
}

interface AppletPlacement {
  appletId: string;     // references the registry (e.g., 'earthquake-feed')
  instanceId: string;   // unique per placement
  position: {
    col: number;        // grid column
    row: number;        // grid row
    w: number;          // width in columns
    h: number;          // height in rows
  };
  config?: Record<string, unknown>;  // applet-specific persisted state
}
```

### Save flow

```
User resizes/moves an applet, or applet calls onStateChange
  |
  v
Shell debounces and updates the BoardConfig in memory
  |
  v
Shell writes the BoardConfig to IndexedDB
```

### Restore flow

```
App startup
  |
  v
Read last-used BoardConfig from IndexedDB
  |
  v
For each AppletPlacement:
  +-- Create a GridItem at the saved position
  +-- Load the applet module via the registry
  +-- Pass placement.config as initialState in AppletProps
```

### Presets

The shell supports multiple saved board presets. Users can create, rename, duplicate, and delete presets. Switching presets completely replaces the current board layout.

---

## Backend

The backend is a lightweight **Hono** server that provides:

### API proxy

```
GET /api/proxy?url=<encoded-url>&cacheTtl=<ms>
```

Proxies external API requests from the browser. This avoids CORS issues and allows server-side caching. The proxy:

- Enforces rate limits per origin.
- Caches responses with a configurable TTL.
- Strips sensitive headers.

### Aggregation endpoints

Some applets use server-side aggregation:

- `/api/news` -- Fetches and aggregates multiple RSS feeds, parses them, and returns a unified `NewsItem[]` array.
- `/api/weather/*` -- Weather data endpoints that may combine multiple upstream sources.

### Caching middleware

The backend includes a caching middleware that stores API responses in memory with TTL. This reduces load on upstream APIs and speeds up responses for frequently accessed data.

### Deployment

The Hono server can run in multiple environments:

- **Node.js**: `node dist/server.js`
- **Bun**: `bun dist/server.js`
- **Edge**: Deployable to Cloudflare Workers, Deno Deploy, etc.

---

## Summary: Request Lifecycle

Here is the full lifecycle of a single data-fetch cycle, from the user's perspective:

```
1. User has "Earthquake Monitor" on their board
2. usePolling timer fires (every 60s)
3. fetcher calls http.get('https://earthquake.usgs.gov/...')
4. HttpService checks cache -- miss, checks inflight -- miss
5. HttpService calls fetch() with 15s timeout via AbortController
6. Request hits the browser network stack (or backend proxy)
7. USGS API returns GeoJSON
8. HttpService parses JSON, writes to TTL cache, resolves promise
9. usePolling receives raw response
10. transform() extracts and parses earthquake features
11. setData() updates the Solid signal
12. Component re-renders: DataList shows updated earthquake list
13. createEffect in useMapLayer detects data change
14. layerFactory() creates a new ScatterplotLayer
15. mapService.setLayers() registers the layer
16. [microtask] MapService notifies the Deck.gl instance
17. Deck.gl re-renders with the new earthquake scatter layer
18. eventBus.emit('earthquake:update', quakes) publishes the data
19. [microtask] Any subscribing applets receive the earthquake data
20. Board state is auto-saved to IndexedDB
```
