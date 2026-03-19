import { Hono } from 'hono';

interface USGSFeature {
  id: string;
  properties: {
    mag: number | null;
    place: string | null;
    time: number;
    url: string;
    tsunami: number;
    type: string;
    title: string;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

interface USGSResponse {
  type: string;
  metadata: {
    generated: number;
    url: string;
    title: string;
    count: number;
  };
  features: USGSFeature[];
}

export const earthquakes = new Hono();

earthquakes.get('/', async (c) => {
  const minMag = parseFloat(c.req.query('minMagnitude') || '2.5');
  const range = c.req.query('timeRange') || '1day';

  const feedMap: Record<string, string> = {
    '1hour': 'all_hour',
    '1day': 'all_day',
    '7days': 'all_week',
    '30days': 'all_month',
  };

  const feed = feedMap[range] || 'all_day';
  const url = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${feed}.geojson`;

  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      return c.json(
        { error: 'Failed to fetch earthquake data', status: res.status },
        502
      );
    }

    const data = (await res.json()) as USGSResponse;

    const quakes = data.features
      .filter((f) => f.properties.mag !== null && f.properties.mag >= minMag)
      .map((f) => ({
        id: f.id,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        depth: f.geometry.coordinates[2],
        magnitude: f.properties.mag,
        place: f.properties.place,
        time: f.properties.time,
        url: f.properties.url,
        tsunami: f.properties.tsunami === 1,
      }));

    c.header('x-cache-ttl', '60000');
    return c.json({
      earthquakes: quakes,
      count: quakes.length,
      fetchedAt: Date.now(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: 'Upstream request failed', detail: message }, 502);
  }
});
