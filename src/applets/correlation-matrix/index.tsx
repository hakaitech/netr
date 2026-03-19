// ============================================================================
// CORRELATION MATRIX — Visual pairwise correlation display for data streams
// ============================================================================

import { Component, For, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import { AppletShell, usePolling } from '../../sdk';

export const manifest: AppletManifest = {
  id: 'correlation-matrix',
  name: 'Correlation Matrix',
  description: 'Pairwise correlation coefficients across financial and macro data streams',
  category: 'analytics',
  icon: 'grid-3x3',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
  refreshInterval: 300_000,
  requiresMap: false,
};

const STREAMS = ['Oil', 'Gold', 'USD', 'VIX', 'BTC', 'S&P500'];

// Realistic-ish correlation matrix (symmetric, diagonal = 1.0)
// Oil-Gold moderate positive, VIX-S&P strong negative, BTC somewhat uncorrelated
const MATRIX: number[][] = [
  //       Oil    Gold   USD    VIX    BTC    S&P
  /*Oil*/  [ 1.00,  0.35, -0.42,  0.28,  0.12, -0.18],
  /*Gold*/ [ 0.35,  1.00, -0.55,  0.40,  0.22, -0.15],
  /*USD*/  [-0.42, -0.55,  1.00, -0.20, -0.18,  0.10],
  /*VIX*/  [ 0.28,  0.40, -0.20,  1.00, -0.08, -0.82],
  /*BTC*/  [ 0.12,  0.22, -0.18, -0.08,  1.00,  0.45],
  /*S&P*/  [-0.18, -0.15,  0.10, -0.82,  0.45,  1.00],
];

interface MatrixData {
  streams: string[];
  matrix: number[][];
}

function fetchMock(): Promise<MatrixData> {
  return new Promise((r) => setTimeout(() => r({ streams: STREAMS, matrix: MATRIX }), 200));
}

/**
 * Map a correlation value (-1..1) to an RGB color.
 * Negative = red tones, positive = green tones, zero = neutral gray.
 */
function corrColor(value: number): string {
  if (value >= 0.99) return 'rgba(99, 102, 241, 0.25)'; // diagonal
  const abs = Math.abs(value);
  const alpha = Math.round(abs * 180 + 20);
  if (value > 0) return `rgba(34, 197, 94, ${alpha / 255})`;
  if (value < 0) return `rgba(239, 68, 68, ${alpha / 255})`;
  return 'rgba(100, 100, 100, 0.1)';
}

function corrTextColor(value: number): string {
  if (Math.abs(value) > 0.5) return 'text-text-primary font-semibold';
  return 'text-text-secondary';
}

const CorrelationMatrix: Component<AppletProps> = (props) => {
  const { data, loading, error } = usePolling<MatrixData>(fetchMock, 300_000);

  const matrixData = createMemo(() => data() ?? { streams: [], matrix: [] });

  return (
    <AppletShell
      title="Correlation Matrix"
      status={loading() ? 'loading' : error() ? 'error' : 'connected'}
      statusText={`${matrixData().streams.length} streams`}
    >
      <div class="p-3 overflow-auto">
        {matrixData().streams.length > 0 && (
          <table class="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th class="p-1.5 text-left text-text-secondary font-normal w-16" />
                <For each={matrixData().streams}>
                  {(name) => (
                    <th class="p-1.5 text-center text-text-secondary font-semibold uppercase text-[10px] tracking-wide">
                      {name}
                    </th>
                  )}
                </For>
              </tr>
            </thead>
            <tbody>
              <For each={matrixData().matrix}>
                {(row, rowIdx) => (
                  <tr>
                    <td class="p-1.5 text-text-secondary font-semibold uppercase text-[10px] tracking-wide whitespace-nowrap">
                      {matrixData().streams[rowIdx()]}
                    </td>
                    <For each={row}>
                      {(value, colIdx) => (
                        <td
                          class={`p-1.5 text-center tabular-nums rounded-sm ${corrTextColor(value)}`}
                          style={{
                            'background-color': corrColor(value),
                            'min-width': '44px',
                          }}
                          title={`${matrixData().streams[rowIdx()]} vs ${matrixData().streams[colIdx()]}: ${value.toFixed(2)}`}
                        >
                          {rowIdx() === colIdx() ? '1.00' : value.toFixed(2)}
                        </td>
                      )}
                    </For>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        )}

        <div class="mt-3 flex items-center justify-center gap-4 text-[10px] text-text-secondary">
          <div class="flex items-center gap-1">
            <span class="w-3 h-3 rounded-sm" style={{ 'background-color': 'rgba(239, 68, 68, 0.6)' }} />
            <span>Negative</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-3 h-3 rounded-sm" style={{ 'background-color': 'rgba(100, 100, 100, 0.15)' }} />
            <span>Zero</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-3 h-3 rounded-sm" style={{ 'background-color': 'rgba(34, 197, 94, 0.6)' }} />
            <span>Positive</span>
          </div>
        </div>
      </div>
    </AppletShell>
  );
};

export default CorrelationMatrix;
