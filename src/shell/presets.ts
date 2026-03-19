// ============================================================================
// PRESET BOARDS -- Predefined board configurations
// ============================================================================

import type { BoardConfig } from '../core/applet.contract';

export const PRESET_BOARDS: BoardConfig[] = [
  {
    id: 'geoint',
    name: 'GEOINT Dashboard',
    columns: 12,
    rowHeight: 80,
    gap: 8,
    applets: [
      {
        appletId: 'deck-map',
        instanceId: 'map-1',
        position: { col: 0, row: 0, w: 8, h: 5 },
      },
      {
        appletId: 'live-news',
        instanceId: 'news-1',
        position: { col: 8, row: 0, w: 4, h: 3 },
      },
      {
        appletId: 'earthquake-feed',
        instanceId: 'eq-1',
        position: { col: 8, row: 3, w: 4, h: 3 },
      },
      {
        appletId: 'flight-tracker',
        instanceId: 'flights-1',
        position: { col: 0, row: 5, w: 4, h: 3 },
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'minimal',
    name: 'Minimal Monitor',
    columns: 12,
    rowHeight: 80,
    gap: 8,
    applets: [
      {
        appletId: 'deck-map',
        instanceId: 'map-1',
        position: { col: 0, row: 0, w: 12, h: 5 },
      },
      {
        appletId: 'live-news',
        instanceId: 'news-1',
        position: { col: 0, row: 5, w: 6, h: 3 },
      },
      {
        appletId: 'earthquake-feed',
        instanceId: 'eq-1',
        position: { col: 6, row: 5, w: 6, h: 3 },
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const DEFAULT_BOARD: BoardConfig = PRESET_BOARDS[0];
