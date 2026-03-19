# Netr

**Real-time global monitoring dashboard with a composable applet architecture.**

Netr is a high-performance, extensible intelligence dashboard that aggregates live data from dozens of open sources — earthquakes, flights, news, markets, cyber threats, weather, infrastructure status, and more — into a single customizable board.

> **Originally inspired by [koala73/worldmonitor](https://github.com/koala73/worldmonitor).** Netr is a ground-up rewrite that replaces the monolithic SPA with a modular applet-based architecture, delivering dramatically better performance and extensibility.

---

## What's Different

### Performance Overhaul

| Area | Original | Netr |
|------|----------|------|
| **Framework** | React (virtual DOM diffing) | **Solid.js** (fine-grained reactivity, no VDOM) |
| **Map engines** | 4 (Deck.gl + MapLibre + D3 + Globe.gl) | **1** (Deck.gl + MapLibre, unified) |
| **CSS** | 366KB monolithic stylesheet | **Tailwind CSS 4** (~15KB gzipped) |
| **Architecture** | 155-panel monolith, all mounted at once | **Composable applets** — only active panels consume resources |
| **State** | Single god-object AppContext | **Applet-local signals** + typed EventBus |
| **Polling** | 30+ independent setInterval loops | **Visibility-gated polling** per applet with auto-cleanup |
| **Backend** | 26 Vercel Edge Functions | **Single Hono server** on Cloudflare Workers |
| **Build output** | Single bundle | **66 code-split chunks** (applets: 2-4KB gzipped each) |
| **Map lib loading** | Eager (800KB+ upfront) | **Lazy** — loaded only when map applet is on board |

### Applet SDK — The Major Upgrade

The Netr SDK is a batteries-included toolkit for building applets in minutes, not hours:

**Hooks:**
- `usePolling(fetcher, interval)` — auto-cleaning interval fetch with loading/error states
- `useMapLayer(services, id, layerFn)` — reactive Deck.gl layer lifecycle on the shared map
- `useEventBus(services, channel, handler)` — typed pub/sub with auto-unsubscribe
- `useAppletState(props, defaults)` — persist applet config to IndexedDB across reloads
- `useFilter(items, filterFn)` — reactive list filtering

**Components:**
- `AppletShell` — standard frame with header, toolbar slot, and scrollable body
- `DataList` — virtualized list with built-in loading, error, and empty states
- `StatGrid` — numeric KPI grid
- `FilterBar` — pill-based category filter
- `Badge`, `Sparkline`, `TimeAgo`, `LoadingState`, `ErrorState`

**Layer Factories:**
- `createScatterLayer()`, `createPathLayer()`, `createArcLayer()`, `createGeoJsonLayer()`
- Pre-configured with dark-theme defaults, just pass your data

**Utilities:**
- `timeAgo`, `formatNumber`, `formatAltitude`, `formatSpeed`, `colorScale`, `debounce`, `generateId`

A typical applet is **80-150 lines** of code. See [`docs/applet-development.md`](docs/applet-development.md) for a full tutorial.

---

## 52 Built-In Applets

| Category | Applets |
|----------|---------|
| **Geospatial** | Live Map, Geocoder Search, Country Profile, Timezone Clock, Coordinate Converter, POI Bookmarks, Geofence Editor, Distance Measure |
| **Intelligence** | Live News, Conflict Tracker, Sanctions List, OSINT Feed, Threat Alerts, Refugee Tracker, Cyber Threat Map, Election Monitor, Protest Tracker |
| **Markets** | Stock Ticker, Crypto Prices, Forex Rates, Commodity Prices, Economic Calendar, Market Heatmap, Bond Yields, Trade Flow Map |
| **Infrastructure** | Flight Tracker, Vessel Tracker, Internet Outages, Power Grid, Subsea Cables, Satellite Tracker, Port Congestion, Rail Traffic, Pipeline Monitor |
| **Environment** | Earthquake Monitor, Weather Radar, Wildfire Tracker, Hurricane Tracker, Volcano Monitor, Air Quality, Sea Temperature, Drought Monitor, Flood Alerts |
| **Analytics** | Event Timeline, Anomaly Detector, Correlation Matrix, Data Export |
| **Utility** | Notepad, Embed iFrame, RSS Reader, Countdown Timer, System Status |

---

## Quick Start

```bash
# Clone
git clone https://github.com/hakaitech/netr.git
cd netr

# Install dependencies
npm install
cd server && npm install && cd ..

# Start backend (port 8787)
cd server && npm run dev:node &

# Start frontend (port 5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Pick a preset board or build your own from the catalog.

### Docker

```bash
# Development (hot-reload)
docker compose up

# Production (single container, nginx + API on port 80)
docker compose --profile prod up --build
```

| Mode | Frontend | API | URL |
|------|----------|-----|-----|
| Dev | Vite HMR `:5173` | tsx watch `:8787` | [localhost:5173](http://localhost:5173) |
| Prod | nginx `:80` | Node `:8787` (internal) | [localhost](http://localhost) |

---

## Extending Netr

Netr is designed to be extended. Two paths:

### Built-in Applets
Create a new directory under `src/applets/`, export a `manifest` and a `default` Solid component, register it in `builtin-registry.ts`. Done.

### External Plugins
Bundle your applet as an ESM module, host it anywhere, and load it at runtime via the plugin registry. No rebuild required.

Full guides:
- [Building Your First Applet](docs/applet-development.md)
- [SDK API Reference](docs/sdk-reference.md)
- [External Plugin System](docs/plugin-system.md)
- [Architecture Overview](docs/architecture.md)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | [Solid.js](https://www.solidjs.com/) |
| Map Engine | [Deck.gl](https://deck.gl/) + [MapLibre GL](https://maplibre.org/) |
| Grid Layout | [GridStack.js](https://gridstackjs.com/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Icons | [Lucide](https://lucide.dev/) |
| Backend | [Hono](https://hono.dev/) on Cloudflare Workers |
| Build | [Vite](https://vitejs.dev/) |
| Persistence | IndexedDB via [idb-keyval](https://github.com/nicedoc/idb-keyval) |

---

## Open Data Sources & Credits

Netr aggregates data from these open services. We are grateful for their public APIs:

| Service | Data | License / Terms |
|---------|------|-----------------|
| [USGS Earthquake Hazards Program](https://earthquake.usgs.gov/) | Real-time earthquake feed (GeoJSON) | Public domain |
| [OpenSky Network](https://opensky-network.org/) | Live aircraft positions (ADS-B) | [OpenSky Terms](https://opensky-network.org/about/terms-of-use) |
| [CARTO Basemaps](https://carto.com/basemaps/) | Dark Matter map tiles | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) |
| [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) | Active fire / hotspot data | Public domain |
| [NOAA / NHC](https://www.nhc.noaa.gov/) | Hurricane & tropical cyclone tracks | Public domain |
| [OpenWeatherMap](https://openweathermap.org/) | Weather data | [OWM Terms](https://openweathermap.org/terms) |
| [CoinGecko](https://www.coingecko.com/) | Cryptocurrency market data | [CoinGecko Terms](https://www.coingecko.com/en/terms) |
| [ACLED](https://acleddata.com/) | Armed conflict & protest events | [ACLED Terms](https://acleddata.com/terms-of-use/) |
| [Smithsonian / GVP](https://volcano.si.edu/) | Global volcanism data | Public |
| [TeleGeography](https://www.submarinecablemap.com/) | Submarine cable data | [TeleGeography Terms](https://www.submarinecablemap.com/) |

> **Note:** Many applets currently use realistic mock data. As you connect real API keys and endpoints, the live data will flow through the same SDK hooks — just swap the fetcher function.

---

## Original Project

This project was inspired by and builds upon the work of **[koala73/worldmonitor](https://github.com/koala73/worldmonitor)** — an AI-powered global monitoring system. Netr takes the original concept and reimagines it with a focus on performance, modularity, and extensibility.

---

## License

MIT
