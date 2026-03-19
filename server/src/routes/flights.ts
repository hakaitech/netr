import { Hono } from 'hono';

interface OpenSkyState {
  /** positional indices from OpenSky states array */
  icao24: string;
  callsign: string | null;
  originCountry: string;
  timePosition: number | null;
  lastContact: number;
  longitude: number | null;
  latitude: number | null;
  baroAltitude: number | null;
  onGround: boolean;
  velocity: number | null;
  trueTrack: number | null;
  verticalRate: number | null;
  geoAltitude: number | null;
  squawk: string | null;
  spi: boolean;
  positionSource: number;
}

interface Aircraft {
  icao24: string;
  callsign: string;
  originCountry: string;
  lat: number;
  lng: number;
  altitude: number | null;
  velocity: number | null;
  heading: number | null;
  verticalRate: number | null;
  onGround: boolean;
  lastContact: number;
}

function parseState(state: (string | number | boolean | null)[]): Aircraft | null {
  const lat = state[6] as number | null;
  const lng = state[5] as number | null;

  // Skip entries without position data
  if (lat === null || lng === null) {
    return null;
  }

  const callsign = (state[1] as string | null)?.trim() || '';

  return {
    icao24: state[0] as string,
    callsign,
    originCountry: state[2] as string,
    lat,
    lng,
    altitude: (state[13] as number | null) ?? (state[7] as number | null),
    velocity: state[9] as number | null,
    heading: state[10] as number | null,
    verticalRate: state[11] as number | null,
    onGround: state[8] as boolean,
    lastContact: state[4] as number,
  };
}

export const flights = new Hono();

flights.get('/', async (c) => {
  const bounds = c.req.query('bounds');

  let url = 'https://opensky-network.org/api/states/all';

  if (bounds) {
    const parts = bounds.split(',');
    if (parts.length === 4) {
      const [lamin, lomin, lamax, lomax] = parts.map((p) => p.trim());
      url += `?lamin=${encodeURIComponent(lamin)}&lomin=${encodeURIComponent(lomin)}&lamax=${encodeURIComponent(lamax)}&lomax=${encodeURIComponent(lomax)}`;
    }
  }

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (res.status === 429) {
      return c.json(
        {
          error: 'Rate limited by upstream (OpenSky Network)',
          detail:
            'OpenSky limits unauthenticated requests to ~100/day. Try again later or provide API credentials.',
          retryAfter: res.headers.get('retry-after') || '60',
        },
        429
      );
    }

    if (!res.ok) {
      return c.json(
        { error: 'Failed to fetch flight data', status: res.status },
        502
      );
    }

    const data = (await res.json()) as {
      time: number;
      states: (string | number | boolean | null)[][] | null;
    };

    if (!data.states) {
      return c.json({
        aircraft: [],
        count: 0,
        fetchedAt: Date.now(),
      });
    }

    const aircraft: Aircraft[] = [];
    for (const state of data.states) {
      const parsed = parseState(state);
      if (parsed !== null) {
        aircraft.push(parsed);
      }
    }

    c.header('x-cache-ttl', '15000'); // Cache for 15 seconds -- flight data is very dynamic
    return c.json({
      aircraft,
      count: aircraft.length,
      fetchedAt: Date.now(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: 'Upstream request failed', detail: message }, 502);
  }
});
