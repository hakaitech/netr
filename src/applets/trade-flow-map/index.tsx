// ============================================================================
// TRADE FLOW MAP — Global import/export flows with arc visualization
// ============================================================================

import { Component, createSignal } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import { AppletShell, DataList, Badge, useMapLayer, createArcLayer, formatNumber } from '../../sdk';

export const manifest: AppletManifest = {
  id: 'trade-flow-map',
  name: 'Trade Flow Map',
  description: 'Major global trade routes with volume and commodity data',
  category: 'market',
  icon: 'globe',
  defaultSize: { w: 3, h: 4 },
  minSize: { w: 2, h: 3 },
  resizable: true,
  requiresMap: true,
  refreshInterval: 600000,
};

interface TradeRoute {
  id: string;
  source: string;
  target: string;
  sourceLng: number;
  sourceLat: number;
  targetLng: number;
  targetLat: number;
  volume: number; // billions USD
  goods: string;
}

const MOCK_ROUTES: TradeRoute[] = [
  { id: 'us-cn', source: 'United States', target: 'China', sourceLng: -98.58, sourceLat: 39.83, targetLng: 104.20, targetLat: 35.86, volume: 582, goods: 'Electronics, Machinery' },
  { id: 'cn-us', source: 'China', target: 'United States', sourceLng: 104.20, sourceLat: 35.86, targetLng: -98.58, targetLat: 39.83, volume: 536, goods: 'Consumer Goods, Tech' },
  { id: 'us-eu', source: 'United States', target: 'EU', sourceLng: -98.58, sourceLat: 39.83, targetLng: 10.45, targetLat: 51.17, volume: 468, goods: 'Pharma, Aircraft, Fuel' },
  { id: 'eu-us', source: 'EU', target: 'United States', sourceLng: 10.45, sourceLat: 51.17, targetLng: -98.58, targetLat: 39.83, volume: 512, goods: 'Machinery, Vehicles, Pharma' },
  { id: 'cn-eu', source: 'China', target: 'EU', sourceLng: 104.20, sourceLat: 35.86, targetLng: 10.45, targetLat: 51.17, volume: 398, goods: 'Electronics, Textiles' },
  { id: 'eu-cn', source: 'EU', target: 'China', sourceLng: 10.45, sourceLat: 51.17, targetLng: 104.20, targetLat: 35.86, volume: 285, goods: 'Vehicles, Machinery' },
  { id: 'us-mx', source: 'United States', target: 'Mexico', sourceLng: -98.58, sourceLat: 39.83, targetLng: -102.55, targetLat: 23.63, volume: 324, goods: 'Fuel, Auto Parts, Electronics' },
  { id: 'mx-us', source: 'Mexico', target: 'United States', sourceLng: -102.55, sourceLat: 23.63, targetLng: -98.58, targetLat: 39.83, volume: 418, goods: 'Vehicles, Electronics, Produce' },
  { id: 'us-ca', source: 'United States', target: 'Canada', sourceLng: -98.58, sourceLat: 39.83, targetLng: -106.35, targetLat: 56.13, volume: 356, goods: 'Vehicles, Machinery' },
  { id: 'ca-us', source: 'Canada', target: 'United States', sourceLng: -106.35, sourceLat: 56.13, targetLng: -98.58, targetLat: 39.83, volume: 382, goods: 'Oil, Vehicles, Lumber' },
  { id: 'cn-jp', source: 'China', target: 'Japan', sourceLng: 104.20, sourceLat: 35.86, targetLng: 138.25, targetLat: 36.20, volume: 178, goods: 'Electronics, Textiles' },
  { id: 'jp-cn', source: 'Japan', target: 'China', sourceLng: 138.25, sourceLat: 36.20, targetLng: 104.20, targetLat: 35.86, volume: 145, goods: 'Semiconductors, Machinery' },
  { id: 'cn-kr', source: 'China', target: 'South Korea', sourceLng: 104.20, sourceLat: 35.86, targetLng: 127.77, targetLat: 35.91, volume: 162, goods: 'Electronics, Raw Materials' },
  { id: 'sa-cn', source: 'Saudi Arabia', target: 'China', sourceLng: 45.08, sourceLat: 23.89, targetLng: 104.20, targetLat: 35.86, volume: 65, goods: 'Crude Oil' },
  { id: 'au-cn', source: 'Australia', target: 'China', sourceLng: 133.78, sourceLat: -25.27, targetLng: 104.20, targetLat: 35.86, volume: 118, goods: 'Iron Ore, Coal, LNG' },
];

const sorted = [...MOCK_ROUTES].sort((a, b) => b.volume - a.volume);
const maxVol = Math.max(...sorted.map((r) => r.volume));

const TradeFlowMap: Component<AppletProps> = (props) => {
  const [routes] = createSignal<TradeRoute[]>(sorted);
  const [loading] = createSignal(false);

  useMapLayer(props, () => {
    const data = routes();
    if (data.length === 0) return null;
    return [
      createArcLayer(`${props.instanceId}-trade-arcs`, data, {
        getSourcePosition: (d: TradeRoute) => [d.sourceLng, d.sourceLat],
        getTargetPosition: (d: TradeRoute) => [d.targetLng, d.targetLat],
        getSourceColor: [99, 102, 241, 180],
        getTargetColor: [236, 72, 153, 180],
        widthMinPixels: 1,
      }),
    ];
  });

  return (
    <AppletShell title="Trade Flows" status="connected" statusText={`${routes().length} routes`}>
      <DataList
        items={routes}
        loading={loading}
        keyFn={(r) => r.id}
        renderItem={(route) => {
          const pct = (route.volume / maxVol) * 100;
          return (
            <div class="px-3 py-2 hover:bg-surface-2 transition-colors">
              <div class="flex items-center justify-between mb-1">
                <div class="text-xs font-semibold">
                  {route.source} → {route.target}
                </div>
                <span class="text-xs font-bold tabular-nums text-accent">
                  ${formatNumber(route.volume)}B
                </span>
              </div>
              <div class="text-[10px] text-text-secondary mb-1.5">{route.goods}</div>
              <div class="w-full h-1 bg-surface-3 rounded-full overflow-hidden">
                <div
                  class="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        }}
      />
    </AppletShell>
  );
};

export default TradeFlowMap;
