// ============================================================================
// SERVICE FACTORY — Instantiates all services and returns the AppletServices
// ============================================================================

import type { AppletServices } from '../core/applet.contract';
import { EventBus } from './event-bus';
import { MapService } from './map-service';
import { HttpService } from './http-service';
import { CacheService } from './cache-service';
import { RealtimeService } from './realtime-service';

export { EventBus } from './event-bus';
export { MapService } from './map-service';
export { HttpService, HttpError } from './http-service';
export { CacheService } from './cache-service';
export { RealtimeService } from './realtime-service';

/**
 * Create a complete set of services ready to be injected into applets.
 *
 * Call this once at application bootstrap and pass the returned object
 * into every applet via `AppletProps.services`.
 */
export function createServices(): AppletServices {
  const eventBus = new EventBus();
  const mapService = new MapService();
  const http = new HttpService();
  const cache = new CacheService();
  const realtime = new RealtimeService();

  return {
    eventBus,
    mapService,
    http,
    cache,
    realtime,
  };
}
