// ============================================================================
// SHARED TYPES — Domain models used across applets and services
// ============================================================================

// ---------------------------------------------------------------------------
// Geospatial
// ---------------------------------------------------------------------------

export interface LatLng {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

// ---------------------------------------------------------------------------
// Earthquakes
// ---------------------------------------------------------------------------

export interface Earthquake {
  id: string;
  lat: number;
  lng: number;
  depth: number;
  magnitude: number;
  place: string;
  time: number;
  url: string;
  tsunami: boolean;
}

// ---------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  category: string;
  publishedAt: number;
  imageUrl?: string;
}

// ---------------------------------------------------------------------------
// Flights / Aircraft
// ---------------------------------------------------------------------------

export interface Aircraft {
  icao24: string;
  callsign: string;
  originCountry: string;
  lat: number;
  lng: number;
  altitude: number;       // meters
  velocity: number;       // m/s
  heading: number;        // degrees from north
  verticalRate: number;   // m/s
  onGround: boolean;
  lastContact: number;
  category: AircraftCategory;
}

export type AircraftCategory =
  | 'military'
  | 'commercial'
  | 'cargo'
  | 'private'
  | 'helicopter'
  | 'unknown';

// ---------------------------------------------------------------------------
// Event Bus Channel Types
// ---------------------------------------------------------------------------

export interface EventChannelMap {
  'earthquake:new': Earthquake;
  'earthquake:update': Earthquake[];
  'news:breaking': NewsItem;
  'news:update': NewsItem[];
  'aircraft:update': Aircraft[];
  'map:viewstate': ViewState;
  'map:click': { lat: number; lng: number; object?: unknown };
  'theme:change': 'dark' | 'light';
  'board:applet-added': { appletId: string; instanceId: string };
  'board:applet-removed': { instanceId: string };
  'applet:visibility': { instanceId: string; visible: boolean };
}
