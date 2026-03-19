// ============================================================================
// ANOMALY DETECTOR — Statistical anomaly monitor for data streams
// ============================================================================

import { Component, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import {
  AppletShell, DataList, StatGrid, Badge, Sparkline, usePolling,
  formatNumber,
} from '../../sdk';

export const manifest: AppletManifest = {
  id: 'anomaly-detector',
  name: 'Anomaly Detector',
  description: 'Statistical anomaly monitor across multiple data streams',
  category: 'analytics',
  icon: 'alert-triangle',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 60_000,
  requiresMap: false,
};

type AnomalyStatus = 'normal' | 'anomaly' | 'critical';

interface DataStream {
  id: string;
  name: string;
  currentValue: number;
  avg30d: number;
  stdDev: number;
  zScore: number;
  status: AnomalyStatus;
  unit: string;
  history: number[];
}

const STATUS_VARIANT: Record<AnomalyStatus, 'success' | 'warning' | 'danger'> = {
  normal: 'success', anomaly: 'warning', critical: 'danger',
};

function zStatus(z: number): AnomalyStatus {
  const abs = Math.abs(z);
  if (abs > 3) return 'critical';
  if (abs > 2) return 'anomaly';
  return 'normal';
}

const MOCK: DataStream[] = [
  { id: 'ds1', name: 'Earthquake frequency (daily)', currentValue: 28, avg30d: 15.2, stdDev: 4.1, zScore: 3.12, status: 'critical', unit: 'events', history: [14, 16, 13, 15, 17, 14, 19, 22, 25, 28] },
  { id: 'ds2', name: 'Global flight count', currentValue: 98500, avg30d: 102300, stdDev: 3200, zScore: -1.19, status: 'normal', unit: 'flights', history: [103000, 101500, 102800, 100200, 99800, 101000, 100500, 99200, 98800, 98500] },
  { id: 'ds3', name: 'Oil price (Brent)', currentValue: 92.40, avg30d: 78.50, stdDev: 5.80, zScore: 2.40, status: 'anomaly', unit: 'USD', history: [77.5, 78.2, 79.0, 80.5, 83.0, 85.5, 88.0, 90.2, 91.5, 92.4] },
  { id: 'ds4', name: 'Bitcoin price', currentValue: 71200, avg30d: 62500, stdDev: 4800, zScore: 1.81, status: 'normal', unit: 'USD', history: [61000, 62500, 63800, 64200, 65500, 67000, 68500, 69800, 70500, 71200] },
  { id: 'ds5', name: 'VIX (Volatility)', currentValue: 32.5, avg30d: 18.2, stdDev: 4.5, zScore: 3.18, status: 'critical', unit: 'pts', history: [17.5, 18.0, 19.2, 21.5, 23.8, 26.0, 28.5, 30.2, 31.8, 32.5] },
  { id: 'ds6', name: 'S&P 500 daily change', currentValue: -2.8, avg30d: 0.05, stdDev: 0.85, zScore: -3.35, status: 'critical', unit: '%', history: [0.3, 0.1, -0.2, -0.5, -1.0, -1.3, -1.8, -2.2, -2.5, -2.8] },
  { id: 'ds7', name: 'Gold price', currentValue: 2180, avg30d: 2050, stdDev: 55, zScore: 2.36, status: 'anomaly', unit: 'USD', history: [2040, 2055, 2070, 2085, 2100, 2120, 2140, 2160, 2170, 2180] },
  { id: 'ds8', name: 'USD Index (DXY)', currentValue: 101.2, avg30d: 103.5, stdDev: 1.2, zScore: -1.92, status: 'normal', unit: 'pts', history: [104.0, 103.8, 103.5, 103.0, 102.5, 102.2, 101.8, 101.5, 101.3, 101.2] },
  { id: 'ds9', name: 'Cargo ship traffic', currentValue: 4820, avg30d: 5200, stdDev: 350, zScore: -1.09, status: 'normal', unit: 'vessels', history: [5300, 5250, 5180, 5100, 5050, 4980, 4920, 4880, 4850, 4820] },
  { id: 'ds10', name: 'Solar activity (sunspot #)', currentValue: 215, avg30d: 145, stdDev: 28, zScore: 2.50, status: 'anomaly', unit: 'spots', history: [140, 148, 155, 162, 175, 185, 195, 205, 210, 215] },
  { id: 'ds11', name: 'Global temp anomaly', currentValue: 1.52, avg30d: 1.35, stdDev: 0.08, zScore: 2.13, status: 'anomaly', unit: 'C', history: [1.33, 1.35, 1.36, 1.38, 1.40, 1.43, 1.46, 1.48, 1.50, 1.52] },
];

function fetchMock(): Promise<DataStream[]> {
  return new Promise((r) => setTimeout(() => r(MOCK), 200));
}

const AnomalyDetector: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling<DataStream[]>(fetchMock, 60_000);
  const items = createMemo(() => {
    const d = data() ?? [];
    return [...d].sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
  });

  const stats = createMemo(() => {
    const d = items();
    return [
      { label: 'Streams', value: d.length },
      { label: 'Anomalies', value: d.filter((s) => s.status === 'anomaly').length, color: 'text-amber-400' },
      { label: 'Critical', value: d.filter((s) => s.status === 'critical').length, color: 'text-red-400' },
    ];
  });

  return (
    <AppletShell
      title="Anomaly Detector"
      status={loading() ? 'loading' : error() ? 'error' : 'connected'}
      statusText={`${items().length} streams`}
      toolbar={<StatGrid stats={stats()} columns={3} />}
    >
      <DataList
        items={items}
        loading={loading}
        error={error}
        renderItem={(stream) => (
          <div class="flex items-center gap-3 px-3 py-2 hover:bg-surface-2 transition-colors">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium truncate">{stream.name}</p>
                <Badge text={stream.status} variant={STATUS_VARIANT[stream.status]} />
              </div>
              <div class="flex items-center gap-3 mt-1 text-xs text-text-secondary">
                <span>Current: <span class="text-text-primary font-medium">{formatNumber(stream.currentValue, { decimals: stream.currentValue < 10 ? 2 : 0 })}</span> {stream.unit}</span>
                <span>Avg: {formatNumber(stream.avg30d, { decimals: stream.avg30d < 10 ? 2 : 0 })}</span>
                <span class={Math.abs(stream.zScore) > 2 ? 'text-amber-400 font-semibold' : ''}>
                  z={stream.zScore > 0 ? '+' : ''}{formatNumber(stream.zScore, { decimals: 2 })}
                </span>
              </div>
            </div>
            <Sparkline
              data={stream.history}
              width={64}
              height={20}
              color={stream.status === 'critical' ? '#ef4444' : stream.status === 'anomaly' ? '#f59e0b' : '#6366f1'}
            />
          </div>
        )}
      />
    </AppletShell>
  );
};

export default AnomalyDetector;
