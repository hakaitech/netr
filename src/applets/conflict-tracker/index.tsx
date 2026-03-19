// ============================================================================
// CONFLICT TRACKER — Armed conflicts worldwide with intensity visualization
// ============================================================================

import { Component, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, DataList, FilterBar, Badge,
  usePolling, useMapLayer, useFilter,
  createScatterLayer, formatNumber,
} from '../../sdk';

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

export const manifest: AppletManifest = {
  id: 'conflict-tracker',
  name: 'Conflict Tracker',
  description: 'Active armed conflicts, border disputes, and insurgencies worldwide',
  category: 'intelligence',
  icon: 'swords',
  defaultSize: { w: 3, h: 4 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 300_000,
  requiresMap: true,
};

// ---------------------------------------------------------------------------
// Types & Mock Data
// ---------------------------------------------------------------------------

interface Conflict {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  type: 'Armed Conflict' | 'Border Dispute' | 'Insurgency' | 'Civil War';
  casualties: number;
  startDate: string;
  parties: string[];
  intensity: number; // 1-10
}

const MOCK: Conflict[] = [
  { id: 'c1', name: 'Eastern Ukraine Front', country: 'Ukraine', lat: 48.57, lng: 37.80, type: 'Armed Conflict', casualties: 190000, startDate: '2022-02-24', parties: ['Ukraine', 'Russia'], intensity: 10 },
  { id: 'c2', name: 'Myanmar Civil War', country: 'Myanmar', lat: 19.76, lng: 96.07, type: 'Civil War', casualties: 55000, startDate: '2021-02-01', parties: ['SAC Military', 'NUG/PDF', 'Ethnic Armed Orgs'], intensity: 9 },
  { id: 'c3', name: 'Sudan Internal Conflict', country: 'Sudan', lat: 15.50, lng: 32.56, type: 'Civil War', casualties: 24000, startDate: '2023-04-15', parties: ['SAF', 'RSF'], intensity: 9 },
  { id: 'c4', name: 'Gaza Conflict', country: 'Palestine', lat: 31.35, lng: 34.31, type: 'Armed Conflict', casualties: 46000, startDate: '2023-10-07', parties: ['Israel', 'Hamas', 'PIJ'], intensity: 10 },
  { id: 'c5', name: 'Sahel Insurgency', country: 'Mali', lat: 14.0, lng: -2.0, type: 'Insurgency', casualties: 12000, startDate: '2012-01-17', parties: ['JNIM', 'ISGS', 'Mali Junta'], intensity: 7 },
  { id: 'c6', name: 'Tigray Aftermath', country: 'Ethiopia', lat: 13.50, lng: 39.47, type: 'Armed Conflict', casualties: 600000, startDate: '2020-11-04', parties: ['Ethiopian Govt', 'TPLF', 'Eritrea'], intensity: 4 },
  { id: 'c7', name: 'Kivu Conflict', country: 'DR Congo', lat: -1.68, lng: 29.22, type: 'Armed Conflict', casualties: 7000, startDate: '2022-03-01', parties: ['DRC Army', 'M23', 'ADF'], intensity: 8 },
  { id: 'c8', name: 'Cabo Delgado Insurgency', country: 'Mozambique', lat: -12.35, lng: 40.35, type: 'Insurgency', casualties: 4500, startDate: '2017-10-05', parties: ['ISIS-Moz', 'FADM', 'SAMIM'], intensity: 5 },
  { id: 'c9', name: 'Nagorno-Karabakh Aftermath', country: 'Azerbaijan', lat: 39.82, lng: 46.77, type: 'Border Dispute', casualties: 7500, startDate: '2020-09-27', parties: ['Azerbaijan', 'Armenia'], intensity: 2 },
  { id: 'c10', name: 'India-Pakistan LoC', country: 'India', lat: 34.08, lng: 74.80, type: 'Border Dispute', casualties: 350, startDate: '1947-10-22', parties: ['India', 'Pakistan'], intensity: 3 },
  { id: 'c11', name: 'Balochistan Insurgency', country: 'Pakistan', lat: 28.90, lng: 66.50, type: 'Insurgency', casualties: 3100, startDate: '2004-01-01', parties: ['BLA/BLF', 'Pakistan Army'], intensity: 5 },
  { id: 'c12', name: 'Burkina Faso Crisis', country: 'Burkina Faso', lat: 12.27, lng: -1.52, type: 'Insurgency', casualties: 8200, startDate: '2015-01-01', parties: ['JNIM', 'ISGS', 'Burkinabe Junta'], intensity: 8 },
  { id: 'c13', name: 'Somalia Al-Shabaab', country: 'Somalia', lat: 2.05, lng: 45.32, type: 'Insurgency', casualties: 5500, startDate: '2006-01-01', parties: ['Al-Shabaab', 'FGS', 'AMISOM/ATMIS'], intensity: 7 },
  { id: 'c14', name: 'Yemen Civil War', country: 'Yemen', lat: 15.37, lng: 44.19, type: 'Civil War', casualties: 150000, startDate: '2014-09-21', parties: ['Houthis', 'Intl Recognized Govt', 'STC'], intensity: 5 },
  { id: 'c15', name: 'NW Syria Conflict', country: 'Syria', lat: 35.93, lng: 36.63, type: 'Armed Conflict', casualties: 500000, startDate: '2011-03-15', parties: ['HTS', 'SNA', 'SDF', 'Syrian Govt remnants'], intensity: 4 },
  { id: 'c16', name: 'Lake Chad Basin', country: 'Nigeria', lat: 11.85, lng: 13.16, type: 'Insurgency', casualties: 40000, startDate: '2009-07-01', parties: ['Boko Haram', 'ISWAP', 'MNJTF'], intensity: 6 },
  { id: 'c17', name: 'Colombia FARC Dissidents', country: 'Colombia', lat: 2.44, lng: -76.61, type: 'Insurgency', casualties: 2800, startDate: '2017-01-01', parties: ['FARC dissidents', 'ELN', 'Colombian Army'], intensity: 5 },
  { id: 'c18', name: 'Haiti Gang Violence', country: 'Haiti', lat: 18.54, lng: -72.34, type: 'Armed Conflict', casualties: 5600, startDate: '2021-07-07', parties: ['G9 Coalition', 'G-Pep', 'HNP'], intensity: 7 },
  { id: 'c19', name: 'South China Sea Tensions', country: 'Philippines', lat: 14.65, lng: 121.05, type: 'Border Dispute', casualties: 0, startDate: '2012-04-01', parties: ['China', 'Philippines', 'Vietnam', 'Taiwan'], intensity: 3 },
  { id: 'c20', name: 'Manipur Ethnic Conflict', country: 'India', lat: 24.82, lng: 93.95, type: 'Armed Conflict', casualties: 230, startDate: '2023-05-03', parties: ['Meitei groups', 'Kuki-Zo groups'], intensity: 4 },
  { id: 'c21', name: 'Papua Insurgency', country: 'Indonesia', lat: -4.27, lng: 138.08, type: 'Insurgency', casualties: 900, startDate: '1963-01-01', parties: ['OPM/TPNPB', 'TNI/Polri'], intensity: 4 },
];

const TYPE_VARIANTS: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  'Armed Conflict': 'danger',
  'Border Dispute': 'warning',
  'Insurgency': 'warning',
  'Civil War': 'danger',
};

const FILTER_OPTIONS = ['All', 'Armed Conflict', 'Border Dispute', 'Insurgency', 'Civil War'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ConflictTracker: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling<Conflict[]>(
    () => Promise.resolve(MOCK),
    manifest.refreshInterval!,
  );

  const items = createMemo(() => data() ?? []);

  const { filtered, filter, setFilter } = useFilter<Conflict>(
    items,
    (item, f) => item.type === f,
  );

  useMapLayer(props, () => {
    const d = filtered();
    if (!d.length) return null;
    return [createScatterLayer(`${props.instanceId}-conflicts`, d, {
      getPosition: (c: Conflict) => [c.lng, c.lat],
      getRadius: (c: Conflict) => c.intensity * 30000,
      getFillColor: () => [220, 38, 38, 200],
      radiusMinPixels: 4,
      radiusMaxPixels: 30,
    })];
  });

  return (
    <AppletShell
      title="Conflict Tracker"
      status={loading() ? 'loading' : error() ? 'error' : 'connected'}
      statusText={loading() ? 'Updating...' : `${filtered().length} conflicts`}
      toolbar={<FilterBar options={FILTER_OPTIONS} value={filter} onChange={setFilter} />}
    >
      <DataList
        items={filtered}
        loading={loading}
        error={error}
        renderItem={(c: Conflict) => (
          <div class="px-3 py-2.5 hover:bg-surface-2 transition-colors">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium truncate">{c.name}</span>
              <Badge text={c.type} variant={TYPE_VARIANTS[c.type] ?? 'default'} />
            </div>
            <div class="flex items-center gap-2 mt-1 text-xs text-text-secondary">
              <span>{c.country}</span>
              <span>Est. {formatNumber(c.casualties, { compact: true })} casualties</span>
              <span>Since {c.startDate}</span>
            </div>
            <div class="text-xs text-text-secondary mt-0.5 truncate">
              Parties: {c.parties.join(', ')}
            </div>
          </div>
        )}
      />
    </AppletShell>
  );
};

export default ConflictTracker;
