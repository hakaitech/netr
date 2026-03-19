// ============================================================================
// Shared Utilities
// ============================================================================

/**
 * Human-readable relative time: "5s ago", "3m ago", "2h ago", "1d ago".
 */
export function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 0) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * Format a number with locale grouping or compact notation.
 * - `formatNumber(12345)` => "12,345"
 * - `formatNumber(12345, { compact: true })` => "12.3K"
 * - `formatNumber(3.14159, { decimals: 2 })` => "3.14"
 */
export function formatNumber(
  n: number,
  opts?: { compact?: boolean; decimals?: number },
): string {
  if (opts?.compact) {
    const abs = Math.abs(n);
    if (abs >= 1_000_000_000) {
      return `${(n / 1_000_000_000).toFixed(1)}B`;
    }
    if (abs >= 1_000_000) {
      return `${(n / 1_000_000).toFixed(1)}M`;
    }
    if (abs >= 1_000) {
      return `${(n / 1_000).toFixed(1)}K`;
    }
    return n.toString();
  }
  if (opts?.decimals !== undefined) {
    return n.toFixed(opts.decimals);
  }
  return n.toLocaleString();
}

/**
 * Format altitude in meters to flight level or feet.
 * - 10668m => "FL350"
 * - 762m => "2,500 ft"
 */
export function formatAltitude(meters: number): string {
  const feet = Math.round(meters * 3.28084);
  if (feet >= 10000) return `FL${Math.round(feet / 100)}`;
  return `${feet.toLocaleString()} ft`;
}

/**
 * Format speed from m/s to knots.
 * - 231.5 => "450 kts"
 */
export function formatSpeed(ms: number): string {
  const knots = Math.round(ms * 1.94384);
  return `${knots} kts`;
}

/**
 * Linearly interpolate between palette colors based on a value's position
 * within [min, max]. The palette must contain at least two entries.
 */
export function colorScale(
  value: number,
  min: number,
  max: number,
  palette: [number, number, number, number][],
): [number, number, number, number] {
  if (palette.length === 0) return [0, 0, 0, 255];
  if (palette.length === 1) return palette[0];

  const t = clamp((value - min) / (max - min || 1), 0, 1);
  const segments = palette.length - 1;
  const segment = Math.min(Math.floor(t * segments), segments - 1);
  const segT = t * segments - segment;

  const c0 = palette[segment];
  const c1 = palette[segment + 1];

  return [
    Math.round(c0[0] + (c1[0] - c0[0]) * segT),
    Math.round(c0[1] + (c1[1] - c0[1]) * segT),
    Math.round(c0[2] + (c1[2] - c0[2]) * segT),
    Math.round(c0[3] + (c1[3] - c0[3]) * segT),
  ];
}

/**
 * Clamp a value between min and max (inclusive).
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Debounce a function by the given milliseconds. Returns a wrapped function
 * that delays invocation until the given time has elapsed since the last call.
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  ms: number,
): T {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debounced = (...args: any[]) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  return debounced as unknown as T;
}

/**
 * Generate a short random ID suitable for temporary element keys.
 * Example output: "a3b9x2"
 */
export function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
