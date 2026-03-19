// ============================================================================
// SYSTEM STATUS — Dashboard health monitor with key metrics
// ============================================================================

import { Component, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import { AppletShell, usePolling, StatGrid } from '../../sdk';

export const manifest: AppletManifest = {
  id: 'system-status',
  name: 'System Status',
  description: 'Dashboard health monitor showing system metrics',
  category: 'utility',
  icon: 'activity',
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 10_000,
};

interface HealthResponse {
  status: string;
  uptime?: number;
  registeredApplets?: number;
  activeApplets?: number;
  eventListeners?: number;
  cacheEntries?: number;
  memoryMB?: number;
  version?: string;
}

const FALLBACK_HEALTH: HealthResponse = {
  status: 'ok',
  uptime: 0,
  registeredApplets: 0,
  activeApplets: 0,
  eventListeners: 0,
  cacheEntries: 0,
  memoryMB: 0,
  version: '1.0.0',
};

function formatUptime(seconds: number): string {
  if (seconds <= 0) return '--';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const SystemStatus: Component<AppletProps> = (props) => {
  const startTime = Date.now();

  const { data, loading, error } = usePolling<HealthResponse>(
    async () => {
      try {
        return await props.services.http.get<HealthResponse>('/api/health', { cacheTtl: 5_000 });
      } catch {
        // Fallback: compute client-side metrics
        return {
          ...FALLBACK_HEALTH,
          status: 'ok (client)',
          uptime: Math.floor((Date.now() - startTime) / 1000),
          memoryMB: Math.round(((performance as any).memory?.usedJSHeapSize ?? 0) / 1_048_576),
        };
      }
    },
    10_000,
  );

  const health = createMemo(() => data() ?? FALLBACK_HEALTH);

  const topStats = createMemo(() => [
    { label: 'Status', value: health().status === 'ok' || health().status === 'ok (client)' ? 'OK' : health().status.toUpperCase(), color: health().status.startsWith('ok') ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Uptime', value: formatUptime(health().uptime ?? 0) },
    { label: 'Memory', value: health().memoryMB ? `${health().memoryMB} MB` : '--' },
  ]);

  const bottomStats = createMemo(() => [
    { label: 'Registered Applets', value: health().registeredApplets ?? 0 },
    { label: 'Active Applets', value: health().activeApplets ?? 0 },
    { label: 'Event Listeners', value: health().eventListeners ?? 0 },
    { label: 'Cache Entries', value: health().cacheEntries ?? 0 },
    { label: 'Version', value: health().version ?? '--' },
  ]);

  return (
    <AppletShell
      title="System Status"
      status={loading() ? 'loading' : error() ? 'warning' : health().status.startsWith('ok') ? 'connected' : 'error'}
      statusText={loading() ? 'Polling...' : health().status.startsWith('ok') ? 'Healthy' : 'Degraded'}
    >
      <StatGrid stats={topStats()} columns={3} />
      <StatGrid stats={bottomStats()} columns={3} />

      <div class="px-3 py-2">
        <div class="text-[10px] text-text-secondary">
          Client session started {new Date(startTime).toLocaleTimeString()}. Data refreshes every 10s.
          {error() && <span class="text-amber-400 ml-1">Backend unreachable; showing client-side metrics.</span>}
        </div>
      </div>
    </AppletShell>
  );
};

export default SystemStatus;
