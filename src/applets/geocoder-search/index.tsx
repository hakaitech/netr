// ============================================================================
// GEOCODER SEARCH — Search locations via Nominatim and pan map to results
// ============================================================================

import { Component, createSignal, For, Show } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import { AppletShell, useEventBus, debounce } from '../../sdk';

export const manifest: AppletManifest = {
  id: 'geocoder-search',
  name: 'Geocoder Search',
  description: 'Search for locations and pan the map',
  category: 'geo',
  icon: 'search',
  defaultSize: { w: 2, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
};

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

const GeocoderSearch: Component<AppletProps> = (props) => {
  const [query, setQuery] = createSignal('');
  const [results, setResults] = createSignal<NominatimResult[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const { emit } = useEventBus(props, 'map:viewstate', () => {});

  async function doSearch(q: string) {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    setError(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=10&q=${encodeURIComponent(q)}`;
      const data = await props.services.http.get<NominatimResult[]>(url, { cacheTtl: 300_000 });
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const debouncedSearch = debounce((q: string) => doSearch(q), 400);

  function handleInput(val: string) {
    setQuery(val);
    debouncedSearch(val);
  }

  function goTo(r: NominatimResult) {
    emit({ latitude: parseFloat(r.lat), longitude: parseFloat(r.lon), zoom: 12, pitch: 0, bearing: 0 });
  }

  return (
    <AppletShell title="Geocoder" status={loading() ? 'loading' : undefined}>
      <div class="px-3 py-2 border-b border-border shrink-0">
        <input
          type="text"
          placeholder="Search places..."
          value={query()}
          onInput={(e) => handleInput(e.currentTarget.value)}
          class="w-full bg-surface-2 text-text-primary text-sm rounded px-3 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-text-secondary"
        />
      </div>
      <Show when={error()}>
        <div class="px-3 py-2 text-xs text-red-400">{error()}</div>
      </Show>
      <Show when={loading()}>
        <div class="flex items-center justify-center h-20 text-text-secondary text-sm">Searching...</div>
      </Show>
      <Show when={!loading() && results().length === 0 && query().trim().length > 0 && !error()}>
        <div class="flex items-center justify-center h-20 text-text-secondary text-sm">No results found</div>
      </Show>
      <ul class="divide-y divide-border">
        <For each={results()}>
          {(r) => (
            <li>
              <button
                class="w-full text-left px-3 py-2 hover:bg-surface-2 transition-colors"
                onClick={() => goTo(r)}
              >
                <p class="text-sm leading-snug truncate">{r.display_name}</p>
                <p class="text-xs text-text-secondary mt-0.5">
                  {parseFloat(r.lat).toFixed(4)}, {parseFloat(r.lon).toFixed(4)} &middot; {r.type}
                </p>
              </button>
            </li>
          )}
        </For>
      </ul>
    </AppletShell>
  );
};

export default GeocoderSearch;
