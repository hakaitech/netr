// ============================================================================
// Sparkline — Tiny inline SVG sparkline chart
// ============================================================================

import { JSX, createMemo } from 'solid-js';

interface SparklineProps {
  data: number[];
  width?: number;   // default 80
  height?: number;  // default 24
  color?: string;   // default accent color
  showArea?: boolean; // default true — fill below line
}

/**
 * Renders a minimal SVG sparkline. Data is normalized to fit the viewBox.
 * Supports an optional filled area beneath the line.
 */
export function Sparkline(props: SparklineProps): JSX.Element {
  const w = () => props.width ?? 80;
  const h = () => props.height ?? 24;
  const color = () => props.color ?? '#6366f1';
  const showArea = () => props.showArea ?? true;

  const pathData = createMemo(() => {
    const data = props.data;
    if (!data || data.length < 2) return { line: '', area: '' };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = w();
    const height = h();
    const padding = 1;
    const usableH = height - padding * 2;

    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = padding + usableH - ((val - min) / range) * usableH;
      return [x, y] as [number, number];
    });

    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

    const area = line
      + ` L${points[points.length - 1][0].toFixed(1)},${height}`
      + ` L${points[0][0].toFixed(1)},${height} Z`;

    return { line, area };
  });

  return (
    <svg
      width={w()}
      height={h()}
      viewBox={`0 0 ${w()} ${h()}`}
      class="inline-block"
      aria-hidden="true"
    >
      {showArea() && (
        <path
          d={pathData().area}
          fill={color()}
          opacity="0.15"
        />
      )}
      <path
        d={pathData().line}
        fill="none"
        stroke={color()}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}
