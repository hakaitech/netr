// ============================================================================
// COUNTRY PROFILE — Quick reference cards for world countries
// ============================================================================

import { Component, createSignal, createMemo, For, Show } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import { AppletShell, usePolling, useFilter, formatNumber } from '../../sdk';

export const manifest: AppletManifest = {
  id: 'country-profile',
  name: 'Country Profile',
  description: 'Quick reference cards for world countries',
  category: 'geo',
  icon: 'globe',
  defaultSize: { w: 3, h: 4 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 3_600_000,
};

interface Country {
  name: { common: string; official: string };
  capital?: string[];
  population: number;
  area: number;
  flags: { png: string; svg: string };
  region: string;
  subregion?: string;
  timezones: string[];
  currencies?: Record<string, { name: string; symbol: string }>;
  languages?: Record<string, string>;
}

const API_URL = 'https://restcountries.com/v3.1/all?fields=name,capital,population,area,flags,region,subregion,timezones,currencies,languages';

const CountryProfile: Component<AppletProps> = (props) => {
  const [selected, setSelected] = createSignal<Country | null>(null);

  const { data, loading, error, refresh } = usePolling<Country[]>(
    () => props.services.http.get<Country[]>(API_URL, { cacheTtl: 3_600_000 }),
    3_600_000,
    { transform: (d) => d.sort((a, b) => a.name.common.localeCompare(b.name.common)) },
  );

  const items = createMemo(() => data() ?? []);
  const { filtered, filter, setFilter } = useFilter<Country>(
    items,
    (c, f) => c.name.common.toLowerCase().includes(f.toLowerCase()),
  );

  return (
    <AppletShell
      title="Countries"
      status={loading() ? 'loading' : error() ? 'error' : 'connected'}
      statusText={loading() ? 'Loading' : error() ? 'Error' : `${items().length}`}
    >
      <div class="px-3 py-2 border-b border-border shrink-0">
        <input
          type="text"
          placeholder="Search countries..."
          value={filter()}
          onInput={(e) => { setFilter(e.currentTarget.value); setSelected(null); }}
          class="w-full bg-surface-2 text-text-primary text-sm rounded px-3 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-text-secondary"
        />
      </div>

      <Show when={selected()}>
        {(c) => {
          const country = c();
          const currencies = country.currencies ? Object.values(country.currencies).map(v => `${v.name} (${v.symbol})`).join(', ') : 'N/A';
          const languages = country.languages ? Object.values(country.languages).join(', ') : 'N/A';
          return (
            <div class="p-3 border-b border-border bg-surface-2">
              <button onClick={() => setSelected(null)} class="text-xs text-accent mb-2 hover:underline">&larr; Back to list</button>
              <div class="flex items-start gap-3">
                <img src={country.flags.svg} alt={country.name.common} class="w-16 h-10 object-cover rounded border border-border" />
                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-bold">{country.name.common}</h3>
                  <p class="text-xs text-text-secondary">{country.name.official}</p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div><span class="text-text-secondary">Capital: </span>{country.capital?.[0] ?? 'N/A'}</div>
                <div><span class="text-text-secondary">Region: </span>{country.region}</div>
                <div><span class="text-text-secondary">Population: </span>{formatNumber(country.population, { compact: true })}</div>
                <div><span class="text-text-secondary">Area: </span>{formatNumber(country.area, { compact: true })} km2</div>
                <div><span class="text-text-secondary">Subregion: </span>{country.subregion ?? 'N/A'}</div>
                <div><span class="text-text-secondary">Timezone: </span>{country.timezones[0]}</div>
                <div class="col-span-2"><span class="text-text-secondary">Currencies: </span>{currencies}</div>
                <div class="col-span-2"><span class="text-text-secondary">Languages: </span>{languages}</div>
              </div>
            </div>
          );
        }}
      </Show>

      <Show when={!selected()}>
        <Show when={loading()}>
          <div class="flex items-center justify-center h-32 text-text-secondary text-sm">Loading countries...</div>
        </Show>
        <Show when={!loading() && error()}>
          <div class="px-3 py-4 text-sm text-red-400 text-center">
            {error()}
            <button onClick={refresh} class="block mx-auto mt-2 text-accent text-xs hover:underline">Retry</button>
          </div>
        </Show>
        <Show when={!loading() && !error()}>
          <ul class="divide-y divide-border">
            <For each={filtered()}>
              {(c) => (
                <li>
                  <button class="w-full text-left flex items-center gap-2.5 px-3 py-2 hover:bg-surface-2 transition-colors" onClick={() => setSelected(c)}>
                    <img src={c.flags.svg} alt="" class="w-8 h-5 object-cover rounded border border-border shrink-0" />
                    <div class="flex-1 min-w-0">
                      <p class="text-sm truncate">{c.name.common}</p>
                      <p class="text-xs text-text-secondary">{c.capital?.[0] ?? ''} &middot; {formatNumber(c.population, { compact: true })}</p>
                    </div>
                  </button>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </Show>
    </AppletShell>
  );
};

export default CountryProfile;
