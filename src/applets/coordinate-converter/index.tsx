// ============================================================================
// COORDINATE CONVERTER — Convert lat/lng to DMS and UTM formats
// ============================================================================

import { Component, createSignal, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import { AppletShell, useEventBus } from '../../sdk';

export const manifest: AppletManifest = {
  id: 'coordinate-converter',
  name: 'Coordinate Converter',
  description: 'Convert between decimal, DMS, and UTM coordinate formats',
  category: 'geo',
  icon: 'compass',
  defaultSize: { w: 2, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
};

function toDMS(dd: number, isLat: boolean): string {
  const dir = isLat ? (dd >= 0 ? 'N' : 'S') : (dd >= 0 ? 'E' : 'W');
  const abs = Math.abs(dd);
  const d = Math.floor(abs);
  const mFull = (abs - d) * 60;
  const m = Math.floor(mFull);
  const s = ((mFull - m) * 60).toFixed(2);
  return `${d}\u00B0 ${m}' ${s}" ${dir}`;
}

function toUTM(lat: number, lng: number): string {
  if (lat < -80 || lat > 84) return 'Outside UTM range';
  const zone = Math.floor((lng + 180) / 6) + 1;
  const letter = 'CDEFGHJKLMNPQRSTUVWX'[Math.floor((lat + 80) / 8)] ?? '?';

  const a = 6378137;
  const f = 1 / 298.257223563;
  const e2 = 2 * f - f * f;
  const ep2 = e2 / (1 - e2);
  const k0 = 0.9996;
  const latR = (lat * Math.PI) / 180;
  const lngR = (lng * Math.PI) / 180;
  const lng0 = ((zone - 1) * 6 - 180 + 3) * Math.PI / 180;
  const N = a / Math.sqrt(1 - e2 * Math.sin(latR) ** 2);
  const T = Math.tan(latR) ** 2;
  const C = ep2 * Math.cos(latR) ** 2;
  const A = Math.cos(latR) * (lngR - lng0);
  const M = a * ((1 - e2 / 4 - 3 * e2 ** 2 / 64) * latR
    - (3 * e2 / 8 + 3 * e2 ** 2 / 32) * Math.sin(2 * latR)
    + (15 * e2 ** 2 / 256) * Math.sin(4 * latR));

  let easting = k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T ** 2) * A ** 5 / 120) + 500000;
  let northing = k0 * (M + N * Math.tan(latR) * (A ** 2 / 2 + (5 - T + 9 * C + 4 * C ** 2) * A ** 4 / 24));
  if (lat < 0) northing += 10000000;

  return `${zone}${letter} ${Math.round(easting)}E ${Math.round(northing)}N`;
}

const CoordinateConverter: Component<AppletProps> = (props) => {
  const [lat, setLat] = createSignal('');
  const [lng, setLng] = createSignal('');

  useEventBus(props, 'map:click', (e) => {
    setLat(e.lat.toFixed(6));
    setLng(e.lng.toFixed(6));
  });

  const latNum = createMemo(() => parseFloat(lat()));
  const lngNum = createMemo(() => parseFloat(lng()));
  const isValid = createMemo(() => !isNaN(latNum()) && !isNaN(lngNum()) && Math.abs(latNum()) <= 90 && Math.abs(lngNum()) <= 180);

  const dmsLat = createMemo(() => isValid() ? toDMS(latNum(), true) : '--');
  const dmsLng = createMemo(() => isValid() ? toDMS(lngNum(), false) : '--');
  const utm = createMemo(() => isValid() ? toUTM(latNum(), lngNum()) : '--');

  return (
    <AppletShell title="Coord. Converter">
      <div class="p-3 space-y-3">
        <p class="text-xs text-text-secondary">Enter coordinates or click the map to auto-fill.</p>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-text-secondary block mb-1">Latitude</label>
            <input
              type="text" value={lat()} onInput={(e) => setLat(e.currentTarget.value)}
              placeholder="e.g. 40.7128"
              class="w-full bg-surface-2 text-text-primary text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-text-secondary"
            />
          </div>
          <div>
            <label class="text-xs text-text-secondary block mb-1">Longitude</label>
            <input
              type="text" value={lng()} onInput={(e) => setLng(e.currentTarget.value)}
              placeholder="e.g. -74.0060"
              class="w-full bg-surface-2 text-text-primary text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-text-secondary"
            />
          </div>
        </div>

        <div class="space-y-2">
          <div class="bg-surface-2 rounded p-2.5 border border-border">
            <div class="text-[10px] text-text-secondary uppercase tracking-wide mb-1">Decimal Degrees</div>
            <div class="text-sm font-mono tabular-nums">{isValid() ? `${latNum().toFixed(6)}, ${lngNum().toFixed(6)}` : '--'}</div>
          </div>
          <div class="bg-surface-2 rounded p-2.5 border border-border">
            <div class="text-[10px] text-text-secondary uppercase tracking-wide mb-1">DMS (Degrees Minutes Seconds)</div>
            <div class="text-sm font-mono tabular-nums">{dmsLat()}</div>
            <div class="text-sm font-mono tabular-nums">{dmsLng()}</div>
          </div>
          <div class="bg-surface-2 rounded p-2.5 border border-border">
            <div class="text-[10px] text-text-secondary uppercase tracking-wide mb-1">UTM</div>
            <div class="text-sm font-mono tabular-nums">{utm()}</div>
          </div>
        </div>
      </div>
    </AppletShell>
  );
};

export default CoordinateConverter;
