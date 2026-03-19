// ============================================================================
// SANCTIONS LIST — Searchable international sanctions registry
// ============================================================================

import { Component, createSignal, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, DataList, FilterBar, Badge,
  usePolling, useFilter,
} from '../../sdk';

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

export const manifest: AppletManifest = {
  id: 'sanctions-list',
  name: 'Sanctions List',
  description: 'Searchable international sanctions database from OFAC, EU, and UN',
  category: 'intelligence',
  icon: 'ban',
  defaultSize: { w: 3, h: 4 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 600_000,
  requiresMap: false,
};

// ---------------------------------------------------------------------------
// Types & Mock Data
// ---------------------------------------------------------------------------

interface SanctionedEntity {
  id: string;
  name: string;
  type: 'Individual' | 'Entity' | 'Vessel';
  sanctioningBody: 'OFAC' | 'EU' | 'UN';
  country: string;
  dateListed: string;
  reason: string;
}

const MOCK: SanctionedEntity[] = [
  { id: 's1', name: 'Evgeny Prigozhin Estate', type: 'Individual', sanctioningBody: 'OFAC', country: 'Russia', dateListed: '2018-09-20', reason: 'Interference in US elections; Wagner Group financing' },
  { id: 's2', name: 'Bank Rossiya', type: 'Entity', sanctioningBody: 'EU', country: 'Russia', dateListed: '2014-03-20', reason: 'Personal bank for senior Russian officials' },
  { id: 's3', name: 'Al-Barakaat International', type: 'Entity', sanctioningBody: 'UN', country: 'Somalia', dateListed: '2001-11-07', reason: 'Terrorist financing network linked to Al-Qaeda' },
  { id: 's4', name: 'Sergei Chemezov', type: 'Individual', sanctioningBody: 'OFAC', country: 'Russia', dateListed: '2022-02-24', reason: 'CEO of Rostec, Russian defense conglomerate' },
  { id: 's5', name: 'MV Suez Rajan', type: 'Vessel', sanctioningBody: 'OFAC', country: 'Iran', dateListed: '2023-05-15', reason: 'Iranian oil smuggling in violation of sanctions' },
  { id: 's6', name: 'Huawei Technologies', type: 'Entity', sanctioningBody: 'OFAC', country: 'China', dateListed: '2019-05-16', reason: 'Activities contrary to US national security' },
  { id: 's7', name: 'Ri Pyong Chol', type: 'Individual', sanctioningBody: 'UN', country: 'North Korea', dateListed: '2017-12-22', reason: 'Senior official in DPRK ballistic missile program' },
  { id: 's8', name: 'Islamic Revolutionary Guard Corps', type: 'Entity', sanctioningBody: 'EU', country: 'Iran', dateListed: '2023-01-23', reason: 'Human rights violations; drone supply to Russia' },
  { id: 's9', name: 'Viktor Bout Network', type: 'Individual', sanctioningBody: 'OFAC', country: 'Russia', dateListed: '2004-06-01', reason: 'International arms trafficking network' },
  { id: 's10', name: 'MV Lady M', type: 'Vessel', sanctioningBody: 'EU', country: 'Russia', dateListed: '2022-03-15', reason: 'Luxury yacht linked to sanctioned oligarch' },
  { id: 's11', name: 'Wagner Group', type: 'Entity', sanctioningBody: 'EU', country: 'Russia', dateListed: '2021-12-13', reason: 'Private military company; human rights abuses in Africa' },
  { id: 's12', name: 'Alisher Usmanov', type: 'Individual', sanctioningBody: 'EU', country: 'Russia', dateListed: '2022-02-28', reason: 'Pro-Kremlin oligarch close to Russian leadership' },
  { id: 's13', name: 'Syrian Scientific Studies Research Center', type: 'Entity', sanctioningBody: 'OFAC', country: 'Syria', dateListed: '2014-05-01', reason: 'Chemical weapons program development' },
  { id: 's14', name: 'Hezbollah', type: 'Entity', sanctioningBody: 'OFAC', country: 'Lebanon', dateListed: '1997-10-08', reason: 'Designated foreign terrorist organization' },
  { id: 's15', name: 'Kim Yo Jong', type: 'Individual', sanctioningBody: 'UN', country: 'North Korea', dateListed: '2017-01-25', reason: 'Senior DPRK propaganda and agitation department' },
  { id: 's16', name: 'MV Angelic Power', type: 'Vessel', sanctioningBody: 'OFAC', country: 'Iran', dateListed: '2024-01-10', reason: 'Transport of Iranian petrochemicals' },
  { id: 's17', name: 'Central Bank of Iran', type: 'Entity', sanctioningBody: 'OFAC', country: 'Iran', dateListed: '2019-09-20', reason: 'Terrorism financing through state banking' },
  { id: 's18', name: 'Lazarus Group', type: 'Entity', sanctioningBody: 'OFAC', country: 'North Korea', dateListed: '2019-09-13', reason: 'State-sponsored cyber attacks and cryptocurrency theft' },
  { id: 's19', name: 'Yevgeny Lebedev', type: 'Individual', sanctioningBody: 'EU', country: 'Russia', dateListed: '2022-04-08', reason: 'Russian media figure with Kremlin ties' },
  { id: 's20', name: 'Myanmar Economic Holdings Ltd', type: 'Entity', sanctioningBody: 'OFAC', country: 'Myanmar', dateListed: '2021-03-22', reason: 'Military conglomerate funding Myanmar junta' },
  { id: 's21', name: 'Bashar al-Assad', type: 'Individual', sanctioningBody: 'EU', country: 'Syria', dateListed: '2011-05-23', reason: 'Authorizing violent repression of civilian population' },
  { id: 's22', name: 'Conor Burns Network', type: 'Entity', sanctioningBody: 'UN', country: 'Libya', dateListed: '2020-06-10', reason: 'Arms embargo violation; fuel smuggling' },
  { id: 's23', name: 'MV Pegas', type: 'Vessel', sanctioningBody: 'EU', country: 'Russia', dateListed: '2022-04-09', reason: 'Superyacht linked to sanctioned Russian national' },
  { id: 's24', name: 'National Iranian Oil Company', type: 'Entity', sanctioningBody: 'OFAC', country: 'Iran', dateListed: '2020-10-26', reason: 'Revenue generation for IRGC and nuclear program' },
  { id: 's25', name: 'Roman Abramovich', type: 'Individual', sanctioningBody: 'EU', country: 'Russia', dateListed: '2022-03-15', reason: 'Steel and investment oligarch with Kremlin ties' },
];

const BODY_VARIANTS: Record<string, 'info' | 'success' | 'default'> = {
  OFAC: 'info',
  EU: 'info',
  UN: 'success',
};

const TYPE_VARIANTS: Record<string, 'success' | 'warning' | 'default'> = {
  Individual: 'success',
  Entity: 'warning',
  Vessel: 'default',
};

const FILTER_OPTIONS = ['All', 'OFAC', 'EU', 'UN'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SanctionsList: Component<AppletProps> = (props) => {
  const [search, setSearch] = createSignal('');

  const { data, loading, error } = usePolling<SanctionedEntity[]>(
    () => Promise.resolve(MOCK),
    manifest.refreshInterval!,
  );

  const items = createMemo(() => data() ?? []);

  const { filtered: bodyFiltered, filter: bodyFilter, setFilter: setBodyFilter } = useFilter<SanctionedEntity>(
    items,
    (item, f) => item.sanctioningBody === f,
  );

  const searchFiltered = createMemo(() => {
    const q = search().toLowerCase();
    if (!q) return bodyFiltered();
    return bodyFiltered().filter(
      (e) => e.name.toLowerCase().includes(q) || e.country.toLowerCase().includes(q) || e.reason.toLowerCase().includes(q),
    );
  });

  return (
    <AppletShell
      title="Sanctions List"
      status={loading() ? 'loading' : error() ? 'error' : 'connected'}
      statusText={`${searchFiltered().length} entities`}
      toolbar={
        <div>
          <div class="px-3 py-2 border-b border-border">
            <input
              type="text"
              placeholder="Search name, country, or reason..."
              class="w-full bg-surface-2 text-text-primary text-xs rounded px-2.5 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-text-secondary"
              value={search()}
              onInput={(e) => setSearch(e.currentTarget.value)}
            />
          </div>
          <FilterBar options={FILTER_OPTIONS} value={bodyFilter} onChange={setBodyFilter} />
        </div>
      }
    >
      <DataList
        items={searchFiltered}
        loading={loading}
        error={error}
        emptyMessage="No matching entities"
        renderItem={(e: SanctionedEntity) => (
          <div class="px-3 py-2.5 hover:bg-surface-2 transition-colors">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium truncate">{e.name}</span>
              <div class="flex items-center gap-1.5 shrink-0">
                <Badge text={e.type} variant={TYPE_VARIANTS[e.type] ?? 'default'} />
                <Badge text={e.sanctioningBody} variant={BODY_VARIANTS[e.sanctioningBody] ?? 'default'} />
              </div>
            </div>
            <div class="flex items-center gap-2 mt-1 text-xs text-text-secondary">
              <span>{e.country}</span>
              <span>Listed {e.dateListed}</span>
            </div>
            <p class="text-xs text-text-secondary mt-0.5 truncate">{e.reason}</p>
          </div>
        )}
      />
    </AppletShell>
  );
};

export default SanctionsList;
