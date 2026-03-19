// ============================================================================
// APPLET CONTRACT — The single interface every applet must implement
// ============================================================================

import type { Component } from 'solid-js';
import type { EventBus } from '../services/event-bus';
import type { MapService } from '../services/map-service';
import type { HttpService } from '../services/http-service';
import type { CacheService } from '../services/cache-service';
import type { RealtimeService } from '../services/realtime-service';

// ---------------------------------------------------------------------------
// Grid & Layout
// ---------------------------------------------------------------------------

export interface GridSize {
  w: number;
  h: number;
}

// ---------------------------------------------------------------------------
// Applet Categories
// ---------------------------------------------------------------------------

export type AppletCategory =
  | 'geo'
  | 'intelligence'
  | 'market'
  | 'infrastructure'
  | 'environment'
  | 'analytics'
  | 'utility';

// ---------------------------------------------------------------------------
// Applet Manifest — static metadata describing the applet
// ---------------------------------------------------------------------------

export interface AppletManifest {
  /** Unique identifier: 'earthquake-feed', 'flight-tracker', etc. */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Short description for the catalog */
  description: string;
  /** Category for grouping in the catalog */
  category: AppletCategory;
  /** Icon identifier (lucide icon name or SVG string) */
  icon: string;
  /** Default grid size when first placed */
  defaultSize: GridSize;
  /** Minimum allowed size */
  minSize: GridSize;
  /** Maximum allowed size (optional) */
  maxSize?: GridSize;
  /** Whether the applet can be resized */
  resizable: boolean;
  /** Polling interval in ms — null means purely event/push driven */
  refreshInterval?: number;
  /** Does this applet publish layers to the shared map? */
  requiresMap?: boolean;
  /** Whether this is an externally-loaded plugin */
  external?: boolean;
  /** Permissions required (for external plugins) */
  permissions?: string[];
  /** JSON Schema for user-configurable settings */
  configSchema?: Record<string, unknown>;
  /** Plugin version (for external plugins) */
  version?: string;
  /** Plugin author (for external plugins) */
  author?: string;
}

// ---------------------------------------------------------------------------
// Services injected into every applet
// ---------------------------------------------------------------------------

export interface AppletServices {
  /** Typed pub/sub for cross-applet communication */
  eventBus: EventBus;
  /** Register/remove Deck.gl layers on the shared map */
  mapService: MapService;
  /** Rate-limited, cached HTTP fetch wrapper */
  http: HttpService;
  /** IndexedDB + in-memory cache */
  cache: CacheService;
  /** WebSocket + SSE connection manager */
  realtime: RealtimeService;
}

// ---------------------------------------------------------------------------
// Applet Component Props — what Solid receives
// ---------------------------------------------------------------------------

export interface AppletProps {
  /** Services injected by the shell */
  services: AppletServices;
  /** Instance ID (unique per placement on board) */
  instanceId: string;
  /** Current container dimensions */
  width: number;
  height: number;
  /** Restored state from board config (if any) */
  initialState?: Record<string, unknown>;
  /** Callback to persist applet-specific state */
  onStateChange?: (state: Record<string, unknown>) => void;
}

// ---------------------------------------------------------------------------
// Applet Module — what each applet file exports
// ---------------------------------------------------------------------------

export interface AppletModule {
  /** The Solid component that renders this applet */
  default: Component<AppletProps>;
  /** Static metadata */
  manifest: AppletManifest;
}

// ---------------------------------------------------------------------------
// Board Configuration — serializable layout
// ---------------------------------------------------------------------------

export interface AppletPlacement {
  /** References the registry (e.g., 'earthquake-feed') */
  appletId: string;
  /** Unique per placement — allows multiple instances of same applet */
  instanceId: string;
  /** Grid position and size */
  position: { col: number; row: number; w: number; h: number };
  /** Applet-specific persisted state */
  config?: Record<string, unknown>;
}

export interface BoardConfig {
  id: string;
  name: string;
  columns: number;
  rowHeight: number;
  gap: number;
  applets: AppletPlacement[];
  createdAt: number;
  updatedAt: number;
}
