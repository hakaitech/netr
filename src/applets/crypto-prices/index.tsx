// ============================================================================
// CRYPTO PRICES — Top cryptocurrency prices with market overview
// ============================================================================

import { Component, createSignal } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import { AppletShell, DataList, StatGrid, Badge, Sparkline, formatNumber } from '../../sdk';

export const manifest: AppletManifest = {
  id: 'crypto-prices',
  name: 'Crypto Prices',
  description: 'Top cryptocurrencies by market cap with 7-day sparklines',
  category: 'market',
  icon: 'bitcoin',
  defaultSize: { w: 3, h: 4 },
  minSize: { w: 2, h: 3 },
  resizable: true,
  refreshInterval: 30000,
};

interface Crypto {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  sparkline7d: number[];
}

const MOCK_CRYPTOS: Crypto[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 67842.50, change24h: 2.14, marketCap: 1332000000000, sparkline7d: [64200,64800,65100,64500,65800,66200,65500,66800,67100,66500,67200,67500,66800,67800] },
  { symbol: 'ETH', name: 'Ethereum', price: 3521.80, change24h: 1.87, marketCap: 423000000000, sparkline7d: [3380,3400,3420,3390,3450,3470,3440,3480,3500,3460,3490,3510,3480,3520] },
  { symbol: 'BNB', name: 'BNB', price: 608.42, change24h: 0.93, marketCap: 91200000000, sparkline7d: [595,598,600,596,602,605,601,604,607,603,606,608,605,608] },
  { symbol: 'SOL', name: 'Solana', price: 148.63, change24h: 3.42, marketCap: 65800000000, sparkline7d: [135,137,139,136,141,143,140,144,146,142,145,147,144,149] },
  { symbol: 'XRP', name: 'XRP', price: 0.5284, change24h: -0.65, marketCap: 28900000000, sparkline7d: [0.535,0.532,0.534,0.530,0.533,0.531,0.529,0.532,0.530,0.528,0.531,0.529,0.527,0.528] },
  { symbol: 'ADA', name: 'Cardano', price: 0.4512, change24h: -1.23, marketCap: 15900000000, sparkline7d: [0.468,0.465,0.462,0.460,0.458,0.461,0.456,0.458,0.455,0.453,0.456,0.454,0.452,0.451] },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.1642, change24h: 4.85, marketCap: 23500000000, sparkline7d: [0.148,0.150,0.152,0.149,0.154,0.156,0.153,0.158,0.160,0.157,0.161,0.163,0.160,0.164] },
  { symbol: 'AVAX', name: 'Avalanche', price: 36.78, change24h: 1.56, marketCap: 14200000000, sparkline7d: [34.5,34.8,35.2,34.9,35.5,35.8,35.3,36.0,36.2,35.8,36.3,36.5,36.2,36.8] },
  { symbol: 'DOT', name: 'Polkadot', price: 7.42, change24h: -0.38, marketCap: 10100000000, sparkline7d: [7.55,7.52,7.50,7.48,7.51,7.49,7.46,7.48,7.45,7.43,7.46,7.44,7.42,7.42] },
  { symbol: 'LINK', name: 'Chainlink', price: 14.86, change24h: 2.31, marketCap: 8700000000, sparkline7d: [13.8,13.9,14.1,13.9,14.2,14.4,14.1,14.5,14.6,14.3,14.6,14.7,14.5,14.9] },
  { symbol: 'MATIC', name: 'Polygon', price: 0.7123, change24h: -1.85, marketCap: 6600000000, sparkline7d: [0.738,0.735,0.731,0.728,0.732,0.728,0.725,0.722,0.726,0.720,0.718,0.715,0.713,0.712] },
  { symbol: 'UNI', name: 'Uniswap', price: 7.84, change24h: 0.52, marketCap: 5900000000, sparkline7d: [7.65,7.68,7.72,7.70,7.74,7.76,7.73,7.78,7.80,7.77,7.81,7.82,7.80,7.84] },
  { symbol: 'ATOM', name: 'Cosmos', price: 9.15, change24h: -0.92, marketCap: 3500000000, sparkline7d: [9.42,9.38,9.35,9.32,9.36,9.30,9.28,9.25,9.28,9.22,9.20,9.18,9.16,9.15] },
  { symbol: 'LTC', name: 'Litecoin', price: 84.52, change24h: 0.28, marketCap: 6300000000, sparkline7d: [83.2,83.5,83.8,83.4,84.0,83.7,83.9,84.1,83.8,84.2,84.4,84.1,84.3,84.5] },
  { symbol: 'NEAR', name: 'NEAR Protocol', price: 5.62, change24h: 1.12, marketCap: 6100000000, sparkline7d: [5.30,5.35,5.38,5.32,5.40,5.42,5.38,5.45,5.48,5.44,5.50,5.55,5.58,5.62] },
];

const TOTAL_MCAP = MOCK_CRYPTOS.reduce((s, c) => s + c.marketCap, 0);
const BTC_DOM = ((MOCK_CRYPTOS[0].marketCap / TOTAL_MCAP) * 100).toFixed(1);

const CryptoPrices: Component<AppletProps> = (props) => {
  const [cryptos] = createSignal<Crypto[]>(MOCK_CRYPTOS);
  const [loading] = createSignal(false);

  const stats = () => [
    { label: 'Total Market Cap', value: formatNumber(TOTAL_MCAP, { compact: true }) },
    { label: 'BTC Dominance', value: `${BTC_DOM}%` },
    { label: '24h Volume', value: '$98.4B' },
  ];

  return (
    <AppletShell title="Crypto Prices" status="connected" statusText="Live">
      <StatGrid stats={stats()} columns={3} />
      <DataList
        items={cryptos}
        loading={loading}
        keyFn={(c) => c.symbol}
        renderItem={(crypto) => (
          <div class="flex items-center gap-2 px-3 py-2 hover:bg-surface-2 transition-colors">
            <div class="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center shrink-0">
              <span class="text-[10px] font-bold text-text-secondary">{crypto.symbol.slice(0, 3)}</span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-xs font-semibold">{crypto.name}</div>
              <div class="text-[10px] text-text-secondary">{crypto.symbol} -- MCap {formatNumber(crypto.marketCap, { compact: true })}</div>
            </div>
            <Sparkline
              data={crypto.sparkline7d}
              width={56}
              height={20}
              color={crypto.change24h >= 0 ? '#10b981' : '#ef4444'}
            />
            <div class="text-right shrink-0 w-24">
              <div class="text-xs font-semibold tabular-nums">
                ${crypto.price >= 1 ? formatNumber(crypto.price, { decimals: 2 }) : crypto.price.toFixed(4)}
              </div>
              <Badge
                text={`${crypto.change24h >= 0 ? '+' : ''}${crypto.change24h.toFixed(2)}%`}
                variant={crypto.change24h >= 0 ? 'success' : 'danger'}
                size="sm"
              />
            </div>
          </div>
        )}
      />
    </AppletShell>
  );
};

export default CryptoPrices;
