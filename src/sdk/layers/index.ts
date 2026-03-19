// ============================================================================
// Layer Factories — Deck.gl layer constructors with dark-theme defaults
// ============================================================================

import { ScatterplotLayer, PathLayer, ArcLayer, GeoJsonLayer } from '@deck.gl/layers';

// ---------------------------------------------------------------------------
// Scatter Layer
// ---------------------------------------------------------------------------

export function createScatterLayer(
  id: string,
  data: unknown[],
  options: {
    getPosition: (d: any) => [number, number];
    getRadius?: (d: any) => number;
    getFillColor?: (d: any) => [number, number, number, number];
    radiusMinPixels?: number;
    radiusMaxPixels?: number;
    pickable?: boolean;
    opacity?: number;
    radiusUnits?: 'meters' | 'pixels';
  },
): ScatterplotLayer {
  return new ScatterplotLayer({
    id,
    data,
    getPosition: options.getPosition,
    getRadius: options.getRadius ?? 1000,
    getFillColor: options.getFillColor ?? [99, 102, 241, 200],
    radiusMinPixels: options.radiusMinPixels ?? 3,
    radiusMaxPixels: options.radiusMaxPixels ?? 40,
    opacity: options.opacity ?? 0.8,
    pickable: options.pickable ?? true,
    radiusUnits: options.radiusUnits,
    // @ts-ignore — updateTriggers accepted at runtime
    updateTriggers: {
      getRadius: options.getRadius,
      getFillColor: options.getFillColor,
    },
  });
}

// ---------------------------------------------------------------------------
// Path Layer
// ---------------------------------------------------------------------------

export function createPathLayer(
  id: string,
  data: unknown[],
  options: {
    getPath: (d: any) => number[][];
    getColor?: (d: any) => [number, number, number, number];
    widthMinPixels?: number;
    pickable?: boolean;
    opacity?: number;
  },
): PathLayer {
  return new PathLayer({
    id,
    data,
    getPath: options.getPath as any,
    getColor: options.getColor ?? [99, 102, 241, 200],
    widthMinPixels: options.widthMinPixels ?? 2,
    opacity: options.opacity ?? 0.8,
    pickable: options.pickable ?? true,
  });
}

// ---------------------------------------------------------------------------
// Arc Layer
// ---------------------------------------------------------------------------

export function createArcLayer(
  id: string,
  data: unknown[],
  options: {
    getSourcePosition: (d: any) => [number, number];
    getTargetPosition: (d: any) => [number, number];
    getSourceColor?: [number, number, number, number];
    getTargetColor?: [number, number, number, number];
    widthMinPixels?: number;
    pickable?: boolean;
    opacity?: number;
  },
): ArcLayer {
  return new ArcLayer({
    id,
    data,
    getSourcePosition: options.getSourcePosition,
    getTargetPosition: options.getTargetPosition,
    getSourceColor: options.getSourceColor ?? [99, 102, 241, 200],
    getTargetColor: options.getTargetColor ?? [236, 72, 153, 200],
    greatCircle: true,
    widthMinPixels: options.widthMinPixels ?? 1,
    opacity: options.opacity ?? 0.8,
    pickable: options.pickable ?? true,
  });
}

// ---------------------------------------------------------------------------
// GeoJSON Layer
// ---------------------------------------------------------------------------

export function createGeoJsonLayer(
  id: string,
  data: unknown,
  options?: {
    getFillColor?: [number, number, number, number];
    getLineColor?: [number, number, number, number];
    lineWidthMinPixels?: number;
    filled?: boolean;
    stroked?: boolean;
    pickable?: boolean;
    opacity?: number;
    pointRadiusMinPixels?: number;
  },
): GeoJsonLayer {
  return new GeoJsonLayer({
    id,
    data: data as any,
    getFillColor: options?.getFillColor ?? [99, 102, 241, 60],
    getLineColor: options?.getLineColor ?? [99, 102, 241, 200],
    lineWidthMinPixels: options?.lineWidthMinPixels ?? 1,
    filled: options?.filled ?? true,
    stroked: options?.stroked ?? true,
    pickable: options?.pickable ?? true,
    opacity: options?.opacity ?? 0.8,
    pointRadiusMinPixels: options?.pointRadiusMinPixels ?? 3,
  });
}
