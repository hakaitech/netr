// ============================================================================
// BUILTIN REGISTRY — Registers all built-in applets into the PluginRegistry
// ============================================================================

import { PluginRegistry } from './plugin-registry';
import type { AppletManifest, AppletModule } from './applet.contract';

// ---------------------------------------------------------------------------
// Applet manifests — grouped by category
// ---------------------------------------------------------------------------

// --- geo ---

const DECK_MAP_MANIFEST: AppletManifest = {
  id: 'deck-map',
  name: 'Live Map',
  description:
    'Interactive Deck.gl + MapLibre map with layers from other applets',
  category: 'geo',
  icon: 'map',
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 3, h: 2 },
  resizable: true,
  requiresMap: false,
};

const GEOCODER_SEARCH_MANIFEST: AppletManifest = {
  id: 'geocoder-search',
  name: 'Geocoder Search',
  description: 'Search and geocode addresses, places, and coordinates worldwide',
  category: 'geo',
  icon: 'search',
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 2 },
  resizable: true,
};

const GEOFENCE_EDITOR_MANIFEST: AppletManifest = {
  id: 'geofence-editor',
  name: 'Geofence Editor',
  description: 'Draw and manage geofence zones on the map for alerts and monitoring',
  category: 'geo',
  icon: 'target',
  defaultSize: { w: 4, h: 3 },
  minSize: { w: 3, h: 2 },
  resizable: true,
  requiresMap: true,
};

const COUNTRY_PROFILE_MANIFEST: AppletManifest = {
  id: 'country-profile',
  name: 'Country Profile',
  description: 'Detailed country information including demographics, economy, and risk indicators',
  category: 'geo',
  icon: 'globe',
  defaultSize: { w: 3, h: 4 },
  minSize: { w: 2, h: 3 },
  resizable: true,
};

const DISTANCE_MEASURE_MANIFEST: AppletManifest = {
  id: 'distance-measure',
  name: 'Distance Measure',
  description: 'Measure distances and areas on the map between any two or more points',
  category: 'geo',
  icon: 'ruler',
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  requiresMap: true,
};

const COORDINATE_CONVERTER_MANIFEST: AppletManifest = {
  id: 'coordinate-converter',
  name: 'Coordinate Converter',
  description: 'Convert between coordinate systems: lat/lon, UTM, MGRS, and more',
  category: 'geo',
  icon: 'compass',
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 2 },
  resizable: true,
};

const TIMEZONE_CLOCK_MANIFEST: AppletManifest = {
  id: 'timezone-clock',
  name: 'Timezone Clock',
  description: 'Display current time across multiple configurable time zones',
  category: 'geo',
  icon: 'clock',
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 1 },
  resizable: true,
  refreshInterval: 1000,
};

const POI_BOOKMARKS_MANIFEST: AppletManifest = {
  id: 'poi-bookmarks',
  name: 'POI Bookmarks',
  description: 'Save and organize points of interest with notes and categories',
  category: 'geo',
  icon: 'bookmark',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  requiresMap: true,
};

// --- intelligence ---

const EARTHQUAKE_MANIFEST: AppletManifest = {
  id: 'earthquake-feed',
  name: 'Earthquake Monitor',
  description: 'Live USGS earthquake feed with magnitude visualization',
  category: 'environment',
  icon: 'activity',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 60000,
};

const LIVE_NEWS_MANIFEST: AppletManifest = {
  id: 'live-news',
  name: 'Live News',
  description: 'Aggregated real-time news from multiple RSS sources',
  category: 'intelligence',
  icon: 'newspaper',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 120000,
};

const FLIGHT_TRACKER_MANIFEST: AppletManifest = {
  id: 'flight-tracker',
  name: 'Flight Tracker',
  description: 'Live aircraft positions from OpenSky Network',
  category: 'infrastructure',
  icon: 'plane',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 10000,
};

const CONFLICT_TRACKER_MANIFEST: AppletManifest = {
  id: 'conflict-tracker',
  name: 'Conflict Tracker',
  description: 'Track active armed conflicts and incidents from ACLED and other sources',
  category: 'intelligence',
  icon: 'crosshair',
  defaultSize: { w: 4, h: 3 },
  minSize: { w: 3, h: 2 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 300000,
};

const SANCTIONS_LIST_MANIFEST: AppletManifest = {
  id: 'sanctions-list',
  name: 'Sanctions List',
  description: 'Search OFAC, EU, and UN sanctions lists for entities and individuals',
  category: 'intelligence',
  icon: 'shield',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 3600000,
};

const OSINT_FEED_MANIFEST: AppletManifest = {
  id: 'osint-feed',
  name: 'OSINT Feed',
  description: 'Aggregated open-source intelligence from curated feeds and sources',
  category: 'intelligence',
  icon: 'radio',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 60000,
};

const THREAT_ALERTS_MANIFEST: AppletManifest = {
  id: 'threat-alerts',
  name: 'Threat Alerts',
  description: 'Real-time threat level alerts and security advisories by region',
  category: 'intelligence',
  icon: 'alert-triangle',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 60000,
};

const REFUGEE_TRACKER_MANIFEST: AppletManifest = {
  id: 'refugee-tracker',
  name: 'Refugee Tracker',
  description: 'Monitor UNHCR refugee flows, displacement data, and camp populations',
  category: 'intelligence',
  icon: 'users',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 3600000,
};

const CYBER_THREAT_MAP_MANIFEST: AppletManifest = {
  id: 'cyber-threat-map',
  name: 'Cyber Threat Map',
  description: 'Visualize live cyber attacks, botnets, and threat origins on a world map',
  category: 'intelligence',
  icon: 'zap',
  defaultSize: { w: 4, h: 3 },
  minSize: { w: 3, h: 2 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 30000,
};

const ELECTION_MONITOR_MANIFEST: AppletManifest = {
  id: 'election-monitor',
  name: 'Election Monitor',
  description: 'Track upcoming and ongoing elections worldwide with results and forecasts',
  category: 'intelligence',
  icon: 'vote',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 600000,
};

const PROTEST_TRACKER_MANIFEST: AppletManifest = {
  id: 'protest-tracker',
  name: 'Protest Tracker',
  description: 'Monitor protests, demonstrations, and civil unrest events globally',
  category: 'intelligence',
  icon: 'megaphone',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 300000,
};

// --- market ---

const STOCK_TICKER_MANIFEST: AppletManifest = {
  id: 'stock-ticker',
  name: 'Stock Ticker',
  description: 'Real-time stock prices, charts, and market data for global exchanges',
  category: 'market',
  icon: 'trending-up',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 15000,
};

const CRYPTO_PRICES_MANIFEST: AppletManifest = {
  id: 'crypto-prices',
  name: 'Crypto Prices',
  description: 'Live cryptocurrency prices, market cap, and volume for top coins',
  category: 'market',
  icon: 'bitcoin',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 10000,
};

const FOREX_RATES_MANIFEST: AppletManifest = {
  id: 'forex-rates',
  name: 'Forex Rates',
  description: 'Live foreign exchange rates and currency pair charts',
  category: 'market',
  icon: 'dollar-sign',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 30000,
};

const COMMODITY_PRICES_MANIFEST: AppletManifest = {
  id: 'commodity-prices',
  name: 'Commodity Prices',
  description: 'Track oil, gold, silver, and other commodity prices in real time',
  category: 'market',
  icon: 'trending-up',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 60000,
};

const ECONOMIC_CALENDAR_MANIFEST: AppletManifest = {
  id: 'economic-calendar',
  name: 'Economic Calendar',
  description: 'Upcoming economic events, earnings reports, and central bank decisions',
  category: 'market',
  icon: 'calendar',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 300000,
};

const MARKET_HEATMAP_MANIFEST: AppletManifest = {
  id: 'market-heatmap',
  name: 'Market Heatmap',
  description: 'Visual heatmap of market sectors showing gainers and losers',
  category: 'market',
  icon: 'grid3x3',
  defaultSize: { w: 4, h: 3 },
  minSize: { w: 3, h: 2 },
  resizable: true,
  refreshInterval: 60000,
};

const BOND_YIELDS_MANIFEST: AppletManifest = {
  id: 'bond-yields',
  name: 'Bond Yields',
  description: 'Government bond yields and yield curves for major economies',
  category: 'market',
  icon: 'landmark',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 60000,
};

const TRADE_FLOW_MAP_MANIFEST: AppletManifest = {
  id: 'trade-flow-map',
  name: 'Trade Flow Map',
  description: 'Visualize international trade flows and bilateral trade volumes on a map',
  category: 'market',
  icon: 'route',
  defaultSize: { w: 4, h: 3 },
  minSize: { w: 3, h: 2 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 3600000,
};

// --- infrastructure ---

const VESSEL_TRACKER_MANIFEST: AppletManifest = {
  id: 'vessel-tracker',
  name: 'Vessel Tracker',
  description: 'Live AIS vessel tracking with ship details and route history',
  category: 'infrastructure',
  icon: 'ship',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 30000,
};

const INTERNET_OUTAGES_MANIFEST: AppletManifest = {
  id: 'internet-outages',
  name: 'Internet Outages',
  description: 'Monitor global internet connectivity outages and disruptions',
  category: 'infrastructure',
  icon: 'wifi-off',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 60000,
};

const POWER_GRID_MANIFEST: AppletManifest = {
  id: 'power-grid',
  name: 'Power Grid',
  description: 'Live electricity grid status, generation mix, and outage reports',
  category: 'infrastructure',
  icon: 'plug',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 300000,
};

const SUBSEA_CABLES_MANIFEST: AppletManifest = {
  id: 'subsea-cables',
  name: 'Subsea Cables',
  description: 'Map of undersea fiber-optic cables with status and capacity data',
  category: 'infrastructure',
  icon: 'anchor',
  defaultSize: { w: 4, h: 3 },
  minSize: { w: 3, h: 2 },
  resizable: true,
  requiresMap: true,
};

const SATELLITE_TRACKER_MANIFEST: AppletManifest = {
  id: 'satellite-tracker',
  name: 'Satellite Tracker',
  description: 'Track satellites in orbit including ISS, Starlink, and GPS constellations',
  category: 'infrastructure',
  icon: 'satellite',
  defaultSize: { w: 4, h: 3 },
  minSize: { w: 3, h: 2 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 5000,
};

const PORT_CONGESTION_MANIFEST: AppletManifest = {
  id: 'port-congestion',
  name: 'Port Congestion',
  description: 'Monitor shipping port congestion levels and vessel wait times globally',
  category: 'infrastructure',
  icon: 'anchor',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 600000,
};

const RAIL_TRAFFIC_MANIFEST: AppletManifest = {
  id: 'rail-traffic',
  name: 'Rail Traffic',
  description: 'Track rail network status, delays, and freight movements',
  category: 'infrastructure',
  icon: 'truck',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 300000,
};

const PIPELINE_MONITOR_MANIFEST: AppletManifest = {
  id: 'pipeline-monitor',
  name: 'Pipeline Monitor',
  description: 'Monitor oil and gas pipeline networks, flow rates, and incident alerts',
  category: 'infrastructure',
  icon: 'route',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 600000,
};

// --- environment ---

const WEATHER_RADAR_MANIFEST: AppletManifest = {
  id: 'weather-radar',
  name: 'Weather Radar',
  description: 'Live weather radar imagery with precipitation and storm tracking',
  category: 'environment',
  icon: 'cloud',
  defaultSize: { w: 4, h: 3 },
  minSize: { w: 3, h: 2 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 300000,
};

const WILDFIRE_TRACKER_MANIFEST: AppletManifest = {
  id: 'wildfire-tracker',
  name: 'Wildfire Tracker',
  description: 'Track active wildfires with NASA FIRMS satellite hotspot data',
  category: 'environment',
  icon: 'flame',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 300000,
};

const HURRICANE_TRACKER_MANIFEST: AppletManifest = {
  id: 'hurricane-tracker',
  name: 'Hurricane Tracker',
  description: 'Monitor tropical cyclones with forecast cones and wind speed data',
  category: 'environment',
  icon: 'wind',
  defaultSize: { w: 4, h: 3 },
  minSize: { w: 3, h: 2 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 600000,
};

const VOLCANO_MONITOR_MANIFEST: AppletManifest = {
  id: 'volcano-monitor',
  name: 'Volcano Monitor',
  description: 'Track volcanic activity, eruption alerts, and ash dispersal worldwide',
  category: 'environment',
  icon: 'activity',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 600000,
};

const AIR_QUALITY_MANIFEST: AppletManifest = {
  id: 'air-quality',
  name: 'Air Quality',
  description: 'Global air quality index data with PM2.5, ozone, and pollutant levels',
  category: 'environment',
  icon: 'thermometer',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 600000,
};

const SEA_TEMPERATURE_MANIFEST: AppletManifest = {
  id: 'sea-temperature',
  name: 'Sea Temperature',
  description: 'Ocean surface temperature anomalies and sea level data visualization',
  category: 'environment',
  icon: 'waves',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 3600000,
};

const DROUGHT_MONITOR_MANIFEST: AppletManifest = {
  id: 'drought-monitor',
  name: 'Drought Monitor',
  description: 'Track drought conditions and severity levels across regions',
  category: 'environment',
  icon: 'thermometer',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 3600000,
};

const FLOOD_ALERTS_MANIFEST: AppletManifest = {
  id: 'flood-alerts',
  name: 'Flood Alerts',
  description: 'Real-time flood warnings, river levels, and inundation forecasts',
  category: 'environment',
  icon: 'droplets',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 300000,
};

// --- analytics ---

const EVENT_TIMELINE_MANIFEST: AppletManifest = {
  id: 'event-timeline',
  name: 'Event Timeline',
  description: 'Chronological timeline of events from all connected applets',
  category: 'analytics',
  icon: 'bar-chart-3',
  defaultSize: { w: 6, h: 2 },
  minSize: { w: 4, h: 2 },
  resizable: true,
};

const CORRELATION_MATRIX_MANIFEST: AppletManifest = {
  id: 'correlation-matrix',
  name: 'Correlation Matrix',
  description: 'Analyze correlations between data streams from different applets',
  category: 'analytics',
  icon: 'git-branch',
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 3, h: 3 },
  resizable: true,
};

const ANOMALY_DETECTOR_MANIFEST: AppletManifest = {
  id: 'anomaly-detector',
  name: 'Anomaly Detector',
  description: 'Detect statistical anomalies and outliers in monitored data feeds',
  category: 'analytics',
  icon: 'alert-triangle',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 60000,
};

const DATA_EXPORT_MANIFEST: AppletManifest = {
  id: 'data-export',
  name: 'Data Export',
  description: 'Export collected data to CSV, JSON, or connect to external APIs',
  category: 'analytics',
  icon: 'download',
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 2 },
  resizable: true,
};

// --- utility ---

const NOTEPAD_MANIFEST: AppletManifest = {
  id: 'notepad',
  name: 'Notepad',
  description: 'Simple scratchpad for notes, observations, and quick annotations',
  category: 'utility',
  icon: 'sticky-note',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
};

const EMBED_IFRAME_MANIFEST: AppletManifest = {
  id: 'embed-iframe',
  name: 'Embed iFrame',
  description: 'Embed any external website or dashboard via configurable iframe',
  category: 'utility',
  icon: 'link',
  defaultSize: { w: 4, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
};

const RSS_READER_MANIFEST: AppletManifest = {
  id: 'rss-reader',
  name: 'RSS Reader',
  description: 'Subscribe to and read custom RSS/Atom feeds in a compact view',
  category: 'utility',
  icon: 'rss',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 300000,
};

const COUNTDOWN_TIMER_MANIFEST: AppletManifest = {
  id: 'countdown-timer',
  name: 'Countdown Timer',
  description: 'Configurable countdown timer for events, deadlines, and briefings',
  category: 'utility',
  icon: 'timer',
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 2, h: 1 },
  resizable: true,
  refreshInterval: 1000,
};

const SYSTEM_STATUS_MANIFEST: AppletManifest = {
  id: 'system-status',
  name: 'System Status',
  description: 'Monitor Netr system health, connected services, and API status',
  category: 'utility',
  icon: 'monitor',
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 30000,
};

const GITHUB_HUB_MANIFEST: AppletManifest = {
  id: 'github-hub',
  name: 'GitHub Hub',
  description: 'Browse issues, pull requests, and commits for any GitHub repository',
  category: 'utility',
  icon: 'github',
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 3, h: 3 },
  resizable: true,
  refreshInterval: 30000,
};

const SLACK_FEED_MANIFEST: AppletManifest = {
  id: 'slack-feed',
  name: 'Slack Feed',
  description: 'Pin Slack channels and stream messages via incoming webhooks',
  category: 'utility',
  icon: 'message-square',
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 3, h: 3 },
  resizable: true,
  refreshInterval: 10000,
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createBuiltinRegistry(): PluginRegistry {
  const registry = new PluginRegistry();

  // --- geo ---
  registry.registerBuiltin(
    'deck-map',
    DECK_MAP_MANIFEST,
    () => import('../applets/deck-map') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'geocoder-search',
    GEOCODER_SEARCH_MANIFEST,
    () => import('../applets/geocoder-search') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'geofence-editor',
    GEOFENCE_EDITOR_MANIFEST,
    () => import('../applets/_placeholder') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'country-profile',
    COUNTRY_PROFILE_MANIFEST,
    () => import('../applets/country-profile') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'distance-measure',
    DISTANCE_MEASURE_MANIFEST,
    () => import('../applets/_placeholder') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'coordinate-converter',
    COORDINATE_CONVERTER_MANIFEST,
    () => import('../applets/coordinate-converter') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'timezone-clock',
    TIMEZONE_CLOCK_MANIFEST,
    () => import('../applets/timezone-clock') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'poi-bookmarks',
    POI_BOOKMARKS_MANIFEST,
    () => import('../applets/poi-bookmarks') as Promise<AppletModule>,
  );

  // --- intelligence ---
  registry.registerBuiltin(
    'earthquake-feed',
    EARTHQUAKE_MANIFEST,
    () => import('../applets/earthquake-feed') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'live-news',
    LIVE_NEWS_MANIFEST,
    () => import('../applets/live-news') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'conflict-tracker',
    CONFLICT_TRACKER_MANIFEST,
    () => import('../applets/conflict-tracker') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'sanctions-list',
    SANCTIONS_LIST_MANIFEST,
    () => import('../applets/sanctions-list') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'osint-feed',
    OSINT_FEED_MANIFEST,
    () => import('../applets/osint-feed') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'threat-alerts',
    THREAT_ALERTS_MANIFEST,
    () => import('../applets/threat-alerts') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'refugee-tracker',
    REFUGEE_TRACKER_MANIFEST,
    () => import('../applets/refugee-tracker') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'cyber-threat-map',
    CYBER_THREAT_MAP_MANIFEST,
    () => import('../applets/cyber-threat-map') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'election-monitor',
    ELECTION_MONITOR_MANIFEST,
    () => import('../applets/election-monitor') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'protest-tracker',
    PROTEST_TRACKER_MANIFEST,
    () => import('../applets/protest-tracker') as Promise<AppletModule>,
  );

  // --- market ---
  registry.registerBuiltin(
    'stock-ticker',
    STOCK_TICKER_MANIFEST,
    () => import('../applets/stock-ticker') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'crypto-prices',
    CRYPTO_PRICES_MANIFEST,
    () => import('../applets/crypto-prices') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'forex-rates',
    FOREX_RATES_MANIFEST,
    () => import('../applets/forex-rates') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'commodity-prices',
    COMMODITY_PRICES_MANIFEST,
    () => import('../applets/commodity-prices') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'economic-calendar',
    ECONOMIC_CALENDAR_MANIFEST,
    () => import('../applets/economic-calendar') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'market-heatmap',
    MARKET_HEATMAP_MANIFEST,
    () => import('../applets/market-heatmap') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'bond-yields',
    BOND_YIELDS_MANIFEST,
    () => import('../applets/bond-yields') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'trade-flow-map',
    TRADE_FLOW_MAP_MANIFEST,
    () => import('../applets/trade-flow-map') as Promise<AppletModule>,
  );

  // --- infrastructure ---
  registry.registerBuiltin(
    'flight-tracker',
    FLIGHT_TRACKER_MANIFEST,
    () => import('../applets/flight-tracker') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'vessel-tracker',
    VESSEL_TRACKER_MANIFEST,
    () => import('../applets/vessel-tracker') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'internet-outages',
    INTERNET_OUTAGES_MANIFEST,
    () => import('../applets/internet-outages') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'power-grid',
    POWER_GRID_MANIFEST,
    () => import('../applets/power-grid') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'subsea-cables',
    SUBSEA_CABLES_MANIFEST,
    () => import('../applets/subsea-cables') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'satellite-tracker',
    SATELLITE_TRACKER_MANIFEST,
    () => import('../applets/satellite-tracker') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'port-congestion',
    PORT_CONGESTION_MANIFEST,
    () => import('../applets/port-congestion') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'rail-traffic',
    RAIL_TRAFFIC_MANIFEST,
    () => import('../applets/rail-traffic') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'pipeline-monitor',
    PIPELINE_MONITOR_MANIFEST,
    () => import('../applets/pipeline-monitor') as Promise<AppletModule>,
  );

  // --- environment ---
  registry.registerBuiltin(
    'weather-radar',
    WEATHER_RADAR_MANIFEST,
    () => import('../applets/weather-radar') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'wildfire-tracker',
    WILDFIRE_TRACKER_MANIFEST,
    () => import('../applets/wildfire-tracker') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'hurricane-tracker',
    HURRICANE_TRACKER_MANIFEST,
    () => import('../applets/hurricane-tracker') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'volcano-monitor',
    VOLCANO_MONITOR_MANIFEST,
    () => import('../applets/volcano-monitor') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'air-quality',
    AIR_QUALITY_MANIFEST,
    () => import('../applets/air-quality') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'sea-temperature',
    SEA_TEMPERATURE_MANIFEST,
    () => import('../applets/sea-temperature') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'drought-monitor',
    DROUGHT_MONITOR_MANIFEST,
    () => import('../applets/drought-monitor') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'flood-alerts',
    FLOOD_ALERTS_MANIFEST,
    () => import('../applets/flood-alerts') as Promise<AppletModule>,
  );

  // --- analytics ---
  registry.registerBuiltin(
    'event-timeline',
    EVENT_TIMELINE_MANIFEST,
    () => import('../applets/event-timeline') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'correlation-matrix',
    CORRELATION_MATRIX_MANIFEST,
    () => import('../applets/correlation-matrix') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'anomaly-detector',
    ANOMALY_DETECTOR_MANIFEST,
    () => import('../applets/anomaly-detector') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'data-export',
    DATA_EXPORT_MANIFEST,
    () => import('../applets/data-export') as Promise<AppletModule>,
  );

  // --- utility ---
  registry.registerBuiltin(
    'notepad',
    NOTEPAD_MANIFEST,
    () => import('../applets/notepad') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'embed-iframe',
    EMBED_IFRAME_MANIFEST,
    () => import('../applets/embed-iframe') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'rss-reader',
    RSS_READER_MANIFEST,
    () => import('../applets/rss-reader') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'countdown-timer',
    COUNTDOWN_TIMER_MANIFEST,
    () => import('../applets/countdown-timer') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'system-status',
    SYSTEM_STATUS_MANIFEST,
    () => import('../applets/system-status') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'github-hub',
    GITHUB_HUB_MANIFEST,
    () => import('../applets/github-hub') as Promise<AppletModule>,
  );
  registry.registerBuiltin(
    'slack-feed',
    SLACK_FEED_MANIFEST,
    () => import('../applets/slack-feed') as Promise<AppletModule>,
  );

  return registry;
}
