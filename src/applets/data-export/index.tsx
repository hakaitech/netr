// ============================================================================
// DATA EXPORT — Utility for exporting mock data as JSON or CSV
// ============================================================================

import { Component, For } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import { AppletShell, Badge } from '../../sdk';

export const manifest: AppletManifest = {
  id: 'data-export',
  name: 'Data Export',
  description: 'Export data from various sources as JSON or CSV files',
  category: 'analytics',
  icon: 'download',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  requiresMap: false,
};

interface ExportSource {
  id: string;
  name: string;
  channel: string;
  rowCount: number;
  description: string;
  sampleData: Record<string, unknown>[];
}

const SOURCES: ExportSource[] = [
  {
    id: 'eq', name: 'Earthquakes', channel: 'earthquake:update', rowCount: 25, description: 'Recent seismic events with magnitude and location',
    sampleData: [
      { id: 'eq1', place: 'Southern California', magnitude: 4.2, depth: 12.5, lat: 34.05, lng: -118.24, time: '2026-03-18T08:30:00Z' },
      { id: 'eq2', place: 'Central Japan', magnitude: 5.1, depth: 35.0, lat: 35.68, lng: 139.69, time: '2026-03-18T06:15:00Z' },
      { id: 'eq3', place: 'Chile Coast', magnitude: 6.0, depth: 22.0, lat: -33.45, lng: -70.67, time: '2026-03-17T22:45:00Z' },
    ],
  },
  {
    id: 'fl', name: 'Flight Positions', channel: 'aircraft:update', rowCount: 50, description: 'Current aircraft positions and flight data',
    sampleData: [
      { icao24: 'a0b1c2', callsign: 'UAL123', originCountry: 'US', lat: 40.71, lng: -74.01, altitude: 10668, velocity: 231, heading: 90 },
      { icao24: 'd3e4f5', callsign: 'BAW456', originCountry: 'GB', lat: 51.47, lng: -0.46, altitude: 11278, velocity: 245, heading: 270 },
    ],
  },
  {
    id: 'nw', name: 'News Articles', channel: 'news:update', rowCount: 30, description: 'Latest global news articles',
    sampleData: [
      { id: 'n1', title: 'Global Markets Rally on Trade Deal', source: 'Reuters', category: 'business', publishedAt: '2026-03-18T10:00:00Z' },
      { id: 'n2', title: 'Arctic Ice Hits Record Low', source: 'AP', category: 'science', publishedAt: '2026-03-18T08:00:00Z' },
    ],
  },
  {
    id: 'wf', name: 'Active Wildfires', channel: 'wildfire:update', rowCount: 15, description: 'Current wildfire locations and containment data',
    sampleData: [
      { name: 'Park Fire', country: 'US', lat: 39.92, lng: -121.60, areaAcres: 429000, containment: 72, confidence: 'high' },
      { name: 'Pantanal Burn', country: 'BR', lat: -16.50, lng: -56.30, areaAcres: 210000, containment: 10, confidence: 'medium' },
    ],
  },
  {
    id: 'aqi', name: 'Air Quality', channel: 'aqi:update', rowCount: 21, description: 'City-level AQI readings and pollutant data',
    sampleData: [
      { city: 'Delhi', country: 'IN', aqi: 312, pollutant: 'PM2.5', category: 'hazardous', lat: 28.61, lng: 77.21 },
      { city: 'London', country: 'GB', aqi: 42, pollutant: 'NO2', category: 'good', lat: 51.51, lng: -0.13 },
    ],
  },
  {
    id: 'sst', name: 'Sea Temperature', channel: 'sst:update', rowCount: 15, description: 'Ocean surface temperature anomalies',
    sampleData: [
      { name: 'Nino 3.4', tempC: 27.8, anomalyC: 1.5, trend: 'warming', lat: 0.0, lng: -160.0 },
      { name: 'Kuroshio Current', tempC: 22.1, anomalyC: -0.3, trend: 'cooling', lat: 32.0, lng: 135.0 },
    ],
  },
];

function toCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      const str = typeof val === 'string' ? val : String(val ?? '');
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const DataExport: Component<AppletProps> = (props) => {
  function handleExportJSON(source: ExportSource) {
    const content = JSON.stringify(source.sampleData, null, 2);
    download(`${source.id}-export.json`, content, 'application/json');
  }

  function handleExportCSV(source: ExportSource) {
    const content = toCSV(source.sampleData);
    download(`${source.id}-export.csv`, content, 'text/csv');
  }

  return (
    <AppletShell
      title="Data Export"
      status="connected"
      statusText={`${SOURCES.length} sources`}
    >
      <ul class="divide-y divide-border">
        <For each={SOURCES}>
          {(source) => (
            <li class="px-3 py-2.5 hover:bg-surface-2 transition-colors">
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium">{source.name}</p>
                    <Badge text={`${source.rowCount} rows`} variant="default" />
                  </div>
                  <p class="text-xs text-text-secondary mt-0.5">{source.description}</p>
                </div>
                <div class="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    class="px-2 py-1 text-[10px] font-semibold uppercase bg-surface-3 hover:bg-accent/20 text-text-primary rounded border border-border transition-colors"
                    onClick={() => handleExportJSON(source)}
                  >
                    JSON
                  </button>
                  <button
                    class="px-2 py-1 text-[10px] font-semibold uppercase bg-surface-3 hover:bg-accent/20 text-text-primary rounded border border-border transition-colors"
                    onClick={() => handleExportCSV(source)}
                  >
                    CSV
                  </button>
                </div>
              </div>
            </li>
          )}
        </For>
      </ul>
    </AppletShell>
  );
};

export default DataExport;
