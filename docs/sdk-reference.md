# SDK API Reference

Complete API reference for every export from the Netr Applet SDK (`src/sdk/index.ts`).

All imports come from a single barrel:

```ts
import {
  usePolling, useMapLayer, useEventBus, useAppletState, useFilter,
  AppletShell, DataList, StatGrid, FilterBar, Badge, LoadingState, ErrorState, TimeAgo, Sparkline,
  createScatterLayer, createPathLayer, createArcLayer, createGeoJsonLayer,
  timeAgo, formatNumber, formatAltitude, formatSpeed, colorScale, clamp, debounce, generateId,
} from '../../sdk';
```

---

## Hooks

### `usePolling`

Reactive interval-based data fetching with automatic cleanup.

```ts
function usePolling<T, R = T>(
  fetcher: () => Promise<R>,
  intervalMs: number,
  options?: UsePollingOptions<R, T>,
): UsePollingResult<T>
```

**Parameters:**

| Parameter     | Type                    | Description |
|---------------|-------------------------|-------------|
| `fetcher`     | `() => Promise<R>`      | Async function that returns raw data. Typically calls `props.services.http.get(...)`. |
| `intervalMs`  | `number`                | Polling interval in milliseconds. |
| `options`     | `UsePollingOptions<R, T>` | Optional configuration (see below). |

**Options:**

| Field       | Type               | Default | Description |
|-------------|--------------------|---------|-------------|
| `immediate` | `boolean`          | `true`  | Whether to run the fetcher immediately on mount. |
| `transform` | `(raw: R) => T`    | identity | Transform the raw response into the desired type. |
| `onSuccess` | `(data: T) => void`| --      | Callback after each successful fetch. |
| `cacheTtl`  | `number`           | --      | Cache TTL passed to HttpService (ms). |

**Return value (`UsePollingResult<T>`):**

| Field     | Type                   | Description |
|-----------|------------------------|-------------|
| `data`    | `Accessor<T \| null>`  | The latest fetched data. `null` until the first successful fetch. |
| `loading` | `Accessor<boolean>`    | `true` during the initial fetch, then `false`. |
| `error`   | `Accessor<string \| null>` | Error message on failure, `null` on success. |
| `refresh` | `() => Promise<void>`  | Manually trigger a fetch outside the interval. |

**Example:**

```ts
const { data, loading, error, refresh } = usePolling<Station[], ApiResponse>(
  () => props.services.http.get<ApiResponse>(API_URL, { cacheTtl: 60_000 }),
  120_000,
  {
    transform: (raw) => raw.stations,
    onSuccess: (stations) => {
      props.services.eventBus.emit('stations:update', stations);
    },
  },
);
```

**Notes:**
- The interval is cleared automatically when the component unmounts (`onCleanup`).
- If the fetcher throws, `error()` is set but `data()` retains the last successful value (it is not reset to `null`).
- Multiple rapid calls to `refresh()` are not deduplicated by the hook itself, but `HttpService.get` deduplicates identical in-flight requests.

---

### `useMapLayer`

Reactively registers Deck.gl layers with the shared MapService. Layers are removed when the factory returns `null`/empty or when the component unmounts.

```ts
function useMapLayer(
  props: AppletProps,
  layerFactory: () => Layer[] | null,
): void
```

**Parameters:**

| Parameter      | Type                       | Description |
|----------------|----------------------------|-------------|
| `props`        | `AppletProps`              | The applet's props (provides `services.mapService` and `instanceId`). |
| `layerFactory` | `() => Layer[] \| null`    | A function that returns an array of Deck.gl layers, or `null` to remove all layers. Runs inside a `createEffect`, so it re-executes whenever any signal it reads changes. |

**Return value:** `void`

**Example:**

```ts
useMapLayer(props, () => {
  const items = data();
  if (!items || items.length === 0) return null;

  return [
    createScatterLayer(`${props.instanceId}-points`, items, {
      getPosition: (d) => [d.lng, d.lat],
      getFillColor: [99, 102, 241, 200],
      radiusMinPixels: 4,
    }),
  ];
});
```

**Notes:**
- Always prefix layer IDs with `props.instanceId` to prevent collisions when multiple instances of the same applet exist on the board.
- The MapService coalesces rapid updates into a single render pass via microtask batching.
- You do not need to call `removeLayers` manually. The hook handles cleanup on unmount.

---

### `useEventBus`

Subscribe to a typed EventBus channel with automatic unsubscription on unmount.

```ts
function useEventBus<K extends keyof EventChannelMap>(
  props: AppletProps,
  channel: K,
  handler: (data: EventChannelMap[K]) => void,
): { emit: (data: EventChannelMap[K]) => void }
```

**Parameters:**

| Parameter | Type                                  | Description |
|-----------|---------------------------------------|-------------|
| `props`   | `AppletProps`                        | The applet's props (provides `services.eventBus`). |
| `channel` | `K extends keyof EventChannelMap`    | The typed channel name to subscribe to. |
| `handler` | `(data: EventChannelMap[K]) => void` | Callback invoked when a message is published on the channel. |

**Return value:**

| Field  | Type                                 | Description |
|--------|--------------------------------------|-------------|
| `emit` | `(data: EventChannelMap[K]) => void` | Convenience function to publish data on the same channel. |

**Available channels (from `EventChannelMap`):**

| Channel                | Payload Type |
|------------------------|--------------|
| `earthquake:new`       | `Earthquake` |
| `earthquake:update`    | `Earthquake[]` |
| `news:breaking`        | `NewsItem` |
| `news:update`          | `NewsItem[]` |
| `aircraft:update`      | `Aircraft[]` |
| `map:viewstate`        | `ViewState` |
| `map:click`            | `{ lat: number; lng: number; object?: unknown }` |
| `theme:change`         | `'dark' \| 'light'` |
| `board:applet-added`   | `{ appletId: string; instanceId: string }` |
| `board:applet-removed` | `{ instanceId: string }` |
| `applet:visibility`    | `{ instanceId: string; visible: boolean }` |

**Example:**

```ts
const { emit } = useEventBus(props, 'earthquake:update', (quakes) => {
  const nearby = quakes.filter((q) => q.magnitude > 5);
  setHighlighted(nearby);
});

// Later, emit on the same channel:
emit(myQuakeData);
```

**Notes:**
- The EventBus coalesces multiple emissions within the same synchronous block. Only the latest value per channel is delivered per microtask flush.
- The subscription is removed automatically on component unmount.

---

### `useAppletState`

Reactive store that merges restored board state with defaults and notifies the shell on changes for persistence.

```ts
function useAppletState<S extends Record<string, unknown>>(
  props: AppletProps,
  defaults: S,
): [get: () => S, set: (partial: Partial<S>) => void]
```

**Parameters:**

| Parameter  | Type          | Description |
|------------|---------------|-------------|
| `props`    | `AppletProps` | The applet's props (provides `initialState` and `onStateChange`). |
| `defaults` | `S`           | Default state values. These are used for any keys not present in the restored state. |

**Return value:** A tuple `[get, set]`:

| Index | Type                        | Description |
|-------|-----------------------------|-------------|
| `[0]` | `() => S`                  | Reactive getter for the current state. |
| `[1]` | `(partial: Partial<S>) => void` | Setter that shallow-merges the partial into the current state and notifies the shell. |

**Example:**

```ts
const [state, setState] = useAppletState(props, {
  selectedCategory: 'All',
  sortOrder: 'desc',
  pageSize: 50,
});

// Read
const category = () => state().selectedCategory;

// Write -- only the changed fields need to be passed
setState({ selectedCategory: 'Airport' });
```

**Notes:**
- The merge is shallow. If your state contains nested objects, you must spread them yourself.
- Every call to the setter invokes `props.onStateChange(...)`, which triggers board persistence.
- Only store serializable values (strings, numbers, booleans, plain arrays/objects). Do not store signals, functions, or class instances.

---

### `useFilter`

Generic reactive list filtering.

```ts
function useFilter<T>(
  items: Accessor<T[]>,
  predicate: (item: T, filter: string) => boolean,
  defaultFilter?: string,
): {
  filtered: Accessor<T[]>;
  filter: Accessor<string>;
  setFilter: (f: string) => void;
}
```

**Parameters:**

| Parameter       | Type                                   | Description |
|-----------------|----------------------------------------|-------------|
| `items`         | `Accessor<T[]>`                       | A reactive accessor returning the full list of items. |
| `predicate`     | `(item: T, filter: string) => boolean` | Return `true` to keep the item for the given filter value. |
| `defaultFilter` | `string`                              | Initial filter value. Default: `''`. |

**Return value:**

| Field       | Type                    | Description |
|-------------|-------------------------|-------------|
| `filtered`  | `Accessor<T[]>`        | The filtered list. Recomputes when `items` or `filter` changes. |
| `filter`    | `Accessor<string>`     | Current filter value. |
| `setFilter` | `(f: string) => void`  | Update the filter value. |

**Example:**

```ts
const { filtered, filter, setFilter } = useFilter(
  () => data() ?? [],
  (station, f) => station.type === f,
  'All',
);
```

**Notes:**
- When the filter value is `''` or `'All'`, all items pass through (no filtering).
- The filtered list is a `createMemo`, so it only recomputes when its dependencies change.

---

## Components

### `AppletShell`

Standard applet frame with header, status indicator, toolbar area, and scrollable body.

```tsx
function AppletShell(props: AppletShellProps): JSX.Element
```

**Props:**

| Prop          | Type          | Required | Description |
|---------------|---------------|----------|-------------|
| `title`       | `string`      | yes      | Title displayed in the header (rendered uppercase). |
| `status`      | `'connected' \| 'error' \| 'loading' \| 'warning'` | no | Controls the status dot color. |
| `statusText`  | `string`      | no       | Text shown next to the status dot. |
| `headerRight` | `JSX.Element` | no       | Custom content rendered in the right side of the header bar (e.g., dropdowns, buttons). |
| `toolbar`     | `JSX.Element` | no       | Content rendered between the header and the scrollable body (e.g., `FilterBar`, `StatGrid`). |
| `children`    | `JSX.Element` | no       | The scrollable body content. |

**Status dot colors:**

| Status       | Dot color                     |
|--------------|-------------------------------|
| `connected`  | `bg-emerald-400` (green)      |
| `error`      | `bg-red-400` (red)            |
| `loading`    | `bg-amber-400 animate-pulse`  |
| `warning`    | `bg-amber-400` (amber)        |

**Example:**

```tsx
<AppletShell
  title="My Applet"
  status={error() ? 'error' : 'connected'}
  statusText={error() ?? 'Live'}
  toolbar={<FilterBar options={opts} value={filter} onChange={setFilter} />}
>
  <DataList items={filtered} loading={loading} renderItem={renderRow} />
</AppletShell>
```

---

### `DataList`

Generic scrollable list that handles loading, error, and empty states.

```tsx
function DataList<T>(props: DataListProps<T>): JSX.Element
```

**Props:**

| Prop             | Type                                          | Required | Description |
|------------------|-----------------------------------------------|----------|-------------|
| `items`          | `Accessor<T[]>`                              | yes      | Reactive list of items to render. |
| `loading`        | `Accessor<boolean>`                          | yes      | Whether data is loading. Shows `LoadingState` when `true`. |
| `error`          | `Accessor<string \| null>`                   | no       | Error message. Shows `ErrorState` when truthy. |
| `renderItem`     | `(item: T, index: number) => JSX.Element`    | yes      | Render function for each list item. |
| `emptyMessage`   | `string`                                     | no       | Message shown when the list is empty. Default: `'No items'`. |
| `loadingMessage` | `string`                                     | no       | Message shown during loading. Default: `'Loading...'`. |
| `keyFn`          | `(item: T) => string \| number`              | no       | Key extraction function for efficient list diffing. |
| `onRetry`        | `() => void`                                 | no       | If provided, a "Retry" button appears on the error state. |

**Example:**

```tsx
<DataList
  items={() => stations()}
  loading={loading}
  error={error}
  emptyMessage="No stations found"
  onRetry={refresh}
  renderItem={(station) => (
    <div class="px-3 py-2 hover:bg-surface-2">
      <span class="text-sm">{station.name}</span>
    </div>
  )}
/>
```

---

### `StatGrid`

Grid of labeled numeric statistics.

```tsx
function StatGrid(props: StatGridProps): JSX.Element
```

**Props:**

| Prop      | Type         | Required | Description |
|-----------|--------------|----------|-------------|
| `stats`   | `StatItem[]` | yes      | Array of stat items to display. |
| `columns` | `number`     | no       | Number of grid columns. Default: `3`. |

**`StatItem` shape:**

| Field   | Type                | Required | Description |
|---------|---------------------|----------|-------------|
| `label` | `string`           | yes      | Label shown below the value (rendered uppercase, small). |
| `value` | `string \| number` | yes      | The stat value. Numbers are formatted with `toLocaleString()`. |
| `color` | `string`           | no       | Tailwind text color class (e.g., `'text-amber-400'`). |

**Example:**

```tsx
<StatGrid
  columns={4}
  stats={[
    { label: 'Total', value: 1234 },
    { label: 'Active', value: 890, color: 'text-emerald-400' },
    { label: 'Errors', value: 12, color: 'text-red-400' },
    { label: 'Uptime', value: '99.9%' },
  ]}
/>
```

---

### `FilterBar`

Row of pill-shaped category filter buttons.

```tsx
function FilterBar(props: FilterBarProps): JSX.Element
```

**Props:**

| Prop       | Type                    | Required | Description |
|------------|-------------------------|----------|-------------|
| `options`  | `string[]`             | yes      | List of filter option labels. |
| `value`    | `Accessor<string>`     | yes      | Currently selected option. |
| `onChange` | `(value: string) => void` | yes   | Called when the user clicks an option. |

**Example:**

```tsx
<FilterBar
  options={['All', 'Critical', 'Warning', 'Info']}
  value={filter}
  onChange={setFilter}
/>
```

**Notes:**
- The active pill uses `bg-accent text-white`. Inactive pills use `bg-surface-2 text-text-secondary`.

---

### `Badge`

Colored badge/pill for status indicators and labels.

```tsx
function Badge(props: BadgeProps): JSX.Element
```

**Props:**

| Prop      | Type                                                  | Required | Description |
|-----------|-------------------------------------------------------|----------|-------------|
| `text`    | `string`                                             | yes      | Badge text (rendered uppercase). |
| `variant` | `'danger' \| 'warning' \| 'success' \| 'info' \| 'default'` | no  | Color variant. Default: `'default'`. |
| `size`    | `'sm' \| 'md'`                                       | no       | Size. Default: `'sm'`. |

**Variant colors:**

| Variant   | Background             | Text color       |
|-----------|------------------------|------------------|
| `danger`  | `bg-red-900/60`        | `text-red-300`   |
| `warning` | `bg-amber-900/60`      | `text-amber-300` |
| `success` | `bg-emerald-900/60`    | `text-emerald-300` |
| `info`    | `bg-blue-900/60`       | `text-blue-300`  |
| `default` | `bg-surface-3`         | `text-text-secondary` |

**Example:**

```tsx
<Badge text="LIVE" variant="success" />
<Badge text="TSUNAMI" variant="danger" size="md" />
```

---

### `LoadingState`

Centered spinner with optional message. Fills the parent container.

```tsx
function LoadingState(props: { message?: string }): JSX.Element
```

**Props:**

| Prop      | Type     | Required | Description |
|-----------|----------|----------|-------------|
| `message` | `string` | no      | Text below the spinner. Default: `'Loading...'`. |

**Example:**

```tsx
<Show when={loading()}>
  <LoadingState message="Fetching satellite data..." />
</Show>
```

---

### `ErrorState`

Centered error message with optional retry button. Fills the parent container.

```tsx
function ErrorState(props: ErrorStateProps): JSX.Element
```

**Props:**

| Prop      | Type           | Required | Description |
|-----------|----------------|----------|-------------|
| `message` | `string`       | yes      | Error message text. |
| `onRetry` | `() => void`   | no       | If provided, a "Retry" button is shown. |

**Example:**

```tsx
<Show when={error()}>
  <ErrorState message={error()!} onRetry={refresh} />
</Show>
```

---

### `TimeAgo`

Displays a human-readable relative time that auto-refreshes every 30 seconds.

```tsx
function TimeAgo(props: { timestamp: number }): JSX.Element
```

**Props:**

| Prop        | Type     | Required | Description |
|-------------|----------|----------|-------------|
| `timestamp` | `number` | yes      | Unix timestamp in milliseconds. |

**Example:**

```tsx
<TimeAgo timestamp={item.updatedAt} />
// Renders: "5m ago", "2h ago", etc.
```

**Notes:**
- Renders as a `<span>` with `text-xs text-text-secondary`.
- The internal interval is cleaned up on unmount.

---

### `Sparkline`

Minimal inline SVG sparkline chart.

```tsx
function Sparkline(props: SparklineProps): JSX.Element
```

**Props:**

| Prop       | Type       | Required | Description |
|------------|------------|----------|-------------|
| `data`     | `number[]` | yes      | Array of numeric data points (minimum 2). |
| `width`    | `number`   | no       | SVG width in pixels. Default: `80`. |
| `height`   | `number`   | no       | SVG height in pixels. Default: `24`. |
| `color`    | `string`   | no       | Stroke/fill color (CSS color string). Default: `'#6366f1'` (indigo). |
| `showArea` | `boolean`  | no       | Whether to fill the area below the line. Default: `true`. |

**Example:**

```tsx
<Sparkline data={[10, 15, 8, 22, 18, 25, 20]} width={100} height={30} color="#10b981" />
```

**Notes:**
- Data is normalized to fit the viewBox, so the sparkline always fills its dimensions.
- Returns an empty SVG if fewer than 2 data points are provided.
- The SVG has `aria-hidden="true"` since sparklines are decorative.

---

## Layer Factories

All layer factories return Deck.gl layer instances with dark-theme-friendly defaults. They are designed to be used inside `useMapLayer`.

### `createScatterLayer`

Creates a `ScatterplotLayer` for point data.

```ts
function createScatterLayer(
  id: string,
  data: unknown[],
  options: {
    getPosition: (d: any) => [number, number];
    getRadius?: (d: any) => number;
    getFillColor?: (d: any) => [number, number, number, number];
    radiusMinPixels?: number;
    radiusMaxPixels?: number;
    pickable?: boolean;
    opacity?: number;
    radiusUnits?: 'meters' | 'pixels';
  },
): ScatterplotLayer
```

**Parameters:**

| Parameter            | Type                                        | Default                    | Description |
|----------------------|---------------------------------------------|----------------------------|-------------|
| `id`                 | `string`                                    | --                         | Unique layer ID. Prefix with `props.instanceId`. |
| `data`               | `unknown[]`                                 | --                         | Array of data objects. |
| `options.getPosition` | `(d) => [number, number]`                  | --                         | Accessor returning `[lng, lat]`. |
| `options.getRadius`  | `(d) => number`                             | `1000`                     | Radius in meters (or pixels if `radiusUnits: 'pixels'`). |
| `options.getFillColor` | `(d) => [r, g, b, a]`                    | `[99, 102, 241, 200]` (indigo) | RGBA fill color. |
| `options.radiusMinPixels` | `number`                              | `3`                        | Minimum rendered radius in pixels. |
| `options.radiusMaxPixels` | `number`                              | `40`                       | Maximum rendered radius in pixels. |
| `options.pickable`   | `boolean`                                   | `true`                     | Whether the layer responds to pointer events. |
| `options.opacity`    | `number`                                    | `0.8`                      | Layer opacity (0-1). |
| `options.radiusUnits` | `'meters' \| 'pixels'`                     | `'meters'`                 | Unit for radius values. |

**Example:**

```ts
createScatterLayer(`${props.instanceId}-quakes`, quakes, {
  getPosition: (d) => [d.lng, d.lat],
  getRadius: (d) => Math.pow(2, d.magnitude) * 800,
  getFillColor: (d) => d.magnitude >= 6 ? [239, 68, 68, 200] : [250, 204, 21, 180],
  radiusMinPixels: 3,
  radiusMaxPixels: 80,
});
```

---

### `createPathLayer`

Creates a `PathLayer` for routes, tracks, and trajectories.

```ts
function createPathLayer(
  id: string,
  data: unknown[],
  options: {
    getPath: (d: any) => number[][];
    getColor?: (d: any) => [number, number, number, number];
    widthMinPixels?: number;
    pickable?: boolean;
    opacity?: number;
  },
): PathLayer
```

**Parameters:**

| Parameter               | Type                          | Default                    | Description |
|-------------------------|-------------------------------|----------------------------|-------------|
| `id`                    | `string`                      | --                         | Unique layer ID. |
| `data`                  | `unknown[]`                   | --                         | Array of data objects. |
| `options.getPath`       | `(d) => number[][]`          | --                         | Accessor returning array of `[lng, lat]` coordinate pairs. |
| `options.getColor`      | `(d) => [r, g, b, a]`       | `[99, 102, 241, 200]`     | RGBA path color. |
| `options.widthMinPixels` | `number`                    | `2`                        | Minimum path width in pixels. |
| `options.pickable`      | `boolean`                    | `true`                     | Whether pickable. |
| `options.opacity`       | `number`                     | `0.8`                      | Layer opacity. |

**Example:**

```ts
createPathLayer(`${props.instanceId}-routes`, flights, {
  getPath: (d) => d.waypoints.map((wp) => [wp.lng, wp.lat]),
  getColor: [59, 130, 246, 180],
  widthMinPixels: 2,
});
```

---

### `createArcLayer`

Creates an `ArcLayer` for origin-destination connections (great-circle arcs).

```ts
function createArcLayer(
  id: string,
  data: unknown[],
  options: {
    getSourcePosition: (d: any) => [number, number];
    getTargetPosition: (d: any) => [number, number];
    getSourceColor?: [number, number, number, number];
    getTargetColor?: [number, number, number, number];
    widthMinPixels?: number;
    pickable?: boolean;
    opacity?: number;
  },
): ArcLayer
```

**Parameters:**

| Parameter                  | Type                    | Default                       | Description |
|----------------------------|-------------------------|-------------------------------|-------------|
| `id`                       | `string`                | --                            | Unique layer ID. |
| `data`                     | `unknown[]`             | --                            | Array of data objects. |
| `options.getSourcePosition` | `(d) => [lng, lat]`   | --                            | Source coordinate accessor. |
| `options.getTargetPosition` | `(d) => [lng, lat]`   | --                            | Target coordinate accessor. |
| `options.getSourceColor`   | `[r, g, b, a]`         | `[99, 102, 241, 200]` (indigo) | Source end color. |
| `options.getTargetColor`   | `[r, g, b, a]`         | `[236, 72, 153, 200]` (pink)  | Target end color. |
| `options.widthMinPixels`   | `number`                | `1`                           | Minimum arc width. |
| `options.pickable`         | `boolean`               | `true`                        | Whether pickable. |
| `options.opacity`          | `number`                | `0.8`                         | Layer opacity. |

**Notes:**
- Arcs are rendered as great circles by default (`greatCircle: true`).

**Example:**

```ts
createArcLayer(`${props.instanceId}-trade`, tradeFlows, {
  getSourcePosition: (d) => [d.originLng, d.originLat],
  getTargetPosition: (d) => [d.destLng, d.destLat],
  getSourceColor: [59, 130, 246, 200],
  getTargetColor: [239, 68, 68, 200],
  widthMinPixels: 1,
});
```

---

### `createGeoJsonLayer`

Creates a `GeoJsonLayer` for rendering GeoJSON features (polygons, lines, points).

```ts
function createGeoJsonLayer(
  id: string,
  data: unknown,
  options?: {
    getFillColor?: [number, number, number, number];
    getLineColor?: [number, number, number, number];
    lineWidthMinPixels?: number;
    filled?: boolean;
    stroked?: boolean;
    pickable?: boolean;
    opacity?: number;
    pointRadiusMinPixels?: number;
  },
): GeoJsonLayer
```

**Parameters:**

| Parameter                    | Type                  | Default                        | Description |
|------------------------------|-----------------------|--------------------------------|-------------|
| `id`                         | `string`              | --                             | Unique layer ID. |
| `data`                       | `unknown`             | --                             | GeoJSON FeatureCollection or Feature object. |
| `options.getFillColor`       | `[r, g, b, a]`       | `[99, 102, 241, 60]`          | Polygon fill color. |
| `options.getLineColor`       | `[r, g, b, a]`       | `[99, 102, 241, 200]`         | Line/border color. |
| `options.lineWidthMinPixels` | `number`              | `1`                            | Minimum line width. |
| `options.filled`             | `boolean`             | `true`                         | Whether to fill polygons. |
| `options.stroked`            | `boolean`             | `true`                         | Whether to draw polygon borders. |
| `options.pickable`           | `boolean`             | `true`                         | Whether pickable. |
| `options.opacity`            | `number`              | `0.8`                          | Layer opacity. |
| `options.pointRadiusMinPixels` | `number`            | `3`                            | Minimum point radius for Point features. |

**Example:**

```ts
createGeoJsonLayer(`${props.instanceId}-boundaries`, geoJsonData, {
  getFillColor: [59, 130, 246, 40],
  getLineColor: [59, 130, 246, 180],
  lineWidthMinPixels: 1,
});
```

---

## Utilities

### `timeAgo`

Formats a timestamp as a human-readable relative time string.

```ts
function timeAgo(ts: number): string
```

| Parameter | Type     | Description |
|-----------|----------|-------------|
| `ts`      | `number` | Unix timestamp in milliseconds. |

**Returns:** A string like `"5s ago"`, `"3m ago"`, `"2h ago"`, `"1d ago"`, or `"just now"` for future timestamps.

**Example:**

```ts
timeAgo(Date.now() - 30000)  // "30s ago"
timeAgo(Date.now() - 7200000) // "2h ago"
```

---

### `formatNumber`

Formats a number with locale grouping or compact notation.

```ts
function formatNumber(
  n: number,
  opts?: { compact?: boolean; decimals?: number },
): string
```

| Parameter       | Type      | Default | Description |
|-----------------|-----------|---------|-------------|
| `n`             | `number`  | --      | The number to format. |
| `opts.compact`  | `boolean` | `false` | Use compact notation (K, M, B). |
| `opts.decimals` | `number`  | --      | Fixed decimal places. |

**Examples:**

```ts
formatNumber(12345)                    // "12,345"
formatNumber(12345, { compact: true }) // "12.3K"
formatNumber(3.14159, { decimals: 2 }) // "3.14"
formatNumber(2500000, { compact: true }) // "2.5M"
```

---

### `formatAltitude`

Converts altitude in meters to flight level or feet.

```ts
function formatAltitude(meters: number): string
```

| Parameter | Type     | Description |
|-----------|----------|-------------|
| `meters`  | `number` | Altitude in meters. |

**Examples:**

```ts
formatAltitude(10668) // "FL350"
formatAltitude(762)   // "2,500 ft"
```

**Notes:** Altitudes >= 10,000 feet are displayed as flight levels (e.g., FL350 = 35,000 ft).

---

### `formatSpeed`

Converts speed from meters per second to knots.

```ts
function formatSpeed(ms: number): string
```

| Parameter | Type     | Description |
|-----------|----------|-------------|
| `ms`      | `number` | Speed in meters per second. |

**Example:**

```ts
formatSpeed(231.5) // "450 kts"
```

---

### `colorScale`

Linearly interpolates between palette colors based on a value's position within a range.

```ts
function colorScale(
  value: number,
  min: number,
  max: number,
  palette: [number, number, number, number][],
): [number, number, number, number]
```

| Parameter | Type                              | Description |
|-----------|-----------------------------------|-------------|
| `value`   | `number`                         | The value to map to a color. |
| `min`     | `number`                         | Minimum of the value range. |
| `max`     | `number`                         | Maximum of the value range. |
| `palette` | `[r, g, b, a][]`                | Array of RGBA colors (at least 2). |

**Returns:** An interpolated `[r, g, b, a]` color.

**Example:**

```ts
const color = colorScale(30, 0, 50, [
  [59, 130, 246, 200],   // blue at 0
  [250, 204, 21, 200],   // yellow at 25
  [239, 68, 68, 200],    // red at 50
]);
// Returns a yellow-orange RGBA value
```

**Notes:**
- Values outside `[min, max]` are clamped.
- The palette can have any number of stops (minimum 2). Interpolation is distributed evenly across stops.

---

### `clamp`

Clamps a value between a minimum and maximum.

```ts
function clamp(value: number, min: number, max: number): number
```

**Example:**

```ts
clamp(150, 0, 100) // 100
clamp(-5, 0, 100)  // 0
clamp(50, 0, 100)  // 50
```

---

### `debounce`

Debounces a function by the given delay. The wrapped function will only execute after the specified time has elapsed since the last call.

```ts
function debounce<T extends (...args: any[]) => void>(
  fn: T,
  ms: number,
): T
```

| Parameter | Type     | Description |
|-----------|----------|-------------|
| `fn`      | `T`      | The function to debounce. |
| `ms`      | `number` | Delay in milliseconds. |

**Example:**

```ts
const debouncedSearch = debounce((query: string) => {
  fetchResults(query);
}, 300);

// In an input handler:
onInput={(e) => debouncedSearch(e.currentTarget.value)}
```

---

### `generateId`

Generates a short random alphanumeric ID (6 characters).

```ts
function generateId(): string
```

**Returns:** A string like `"a3b9x2"`.

**Example:**

```ts
const id = generateId(); // "k7m2p1"
```

**Notes:**
- Suitable for temporary element keys and non-critical unique identifiers.
- Not cryptographically secure. Do not use for security-sensitive identifiers.
