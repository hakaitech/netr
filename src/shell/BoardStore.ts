// ============================================================================
// BOARD STORE — IndexedDB persistence for board configurations via idb-keyval
// ============================================================================

import { get, set, keys, del } from 'idb-keyval';
import type { BoardConfig } from '../core/applet.contract';

const BOARD_KEY_PREFIX = 'wm:board:';
const ACTIVE_BOARD_KEY = 'wm:active-board';

/** Persist a board config to IndexedDB. */
export async function saveBoard(board: BoardConfig): Promise<void> {
  const updated: BoardConfig = { ...board, updatedAt: Date.now() };
  await set(BOARD_KEY_PREFIX + board.id, updated);
}

/** Load a single board by its ID. Returns undefined if not found. */
export async function loadBoard(id: string): Promise<BoardConfig | undefined> {
  return get<BoardConfig>(BOARD_KEY_PREFIX + id);
}

/** Load the currently-active board (last opened). */
export async function loadActiveBoard(): Promise<BoardConfig | undefined> {
  const activeId = await get<string>(ACTIVE_BOARD_KEY);
  if (!activeId) return undefined;
  return loadBoard(activeId);
}

/** Mark a board as the currently-active one. */
export async function setActiveBoard(id: string): Promise<void> {
  await set(ACTIVE_BOARD_KEY, id);
}

/** List every saved board config. */
export async function listBoards(): Promise<BoardConfig[]> {
  const allKeys = await keys();
  const boardKeys = allKeys.filter(
    (k) => typeof k === 'string' && k.startsWith(BOARD_KEY_PREFIX),
  );

  const boards: BoardConfig[] = [];
  for (const key of boardKeys) {
    const board = await get<BoardConfig>(key);
    if (board) boards.push(board);
  }

  return boards.sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Delete a board from IndexedDB. */
export async function deleteBoard(id: string): Promise<void> {
  await del(BOARD_KEY_PREFIX + id);

  // If the deleted board was active, clear the active pointer.
  const activeId = await get<string>(ACTIVE_BOARD_KEY);
  if (activeId === id) {
    await del(ACTIVE_BOARD_KEY);
  }
}
