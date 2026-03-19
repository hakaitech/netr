// ============================================================================
// TOP BAR — Fixed header with board controls, presets, and theme toggle
// ============================================================================

import { createSignal, For, Show } from 'solid-js';
import type { BoardConfig } from '../core/applet.contract';
import { PRESET_BOARDS } from './presets';
import {
  LayoutGrid,
  PanelRightOpen,
  ChevronDown,
  Sun,
  Moon,
  Check,
} from 'lucide-solid';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TopBarProps {
  board: BoardConfig;
  onToggleCatalog: () => void;
  onBoardChange: (board: BoardConfig) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TopBar(props: TopBarProps) {
  const [editing, setEditing] = createSignal(false);
  const [editValue, setEditValue] = createSignal('');
  const [presetsOpen, setPresetsOpen] = createSignal(false);
  const [darkMode, setDarkMode] = createSignal(true);

  // --- Board name editing ---

  function startEditing() {
    setEditValue(props.board.name);
    setEditing(true);
  }

  function commitEdit() {
    const name = editValue().trim();
    if (name && name !== props.board.name) {
      props.onBoardChange({ ...props.board, name, updatedAt: Date.now() });
    }
    setEditing(false);
  }

  function handleEditKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditing(false);
  }

  // --- Preset selection ---

  function selectPreset(preset: BoardConfig) {
    props.onBoardChange({
      ...preset,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setPresetsOpen(false);
  }

  // --- Theme toggle (applies class to documentElement) ---

  function toggleTheme() {
    const next = !darkMode();
    setDarkMode(next);
    document.documentElement.classList.toggle('light', !next);
  }

  return (
    <header class="relative z-20 flex h-12 shrink-0 items-center border-b border-border bg-surface-1 px-4">
      {/* Left: Logo / Title */}
      <div class="flex items-center gap-2 text-text-primary">
        <LayoutGrid size={18} class="text-accent" />
        <span class="text-sm font-semibold tracking-wide">Netr</span>
      </div>

      {/* Center: Board name (editable) */}
      <div class="absolute inset-x-0 flex justify-center pointer-events-none">
        <div class="pointer-events-auto">
          <Show
            when={editing()}
            fallback={
              <button
                class="rounded px-3 py-1 text-sm font-medium text-text-primary hover:bg-surface-2 transition-colors"
                onClick={startEditing}
                aria-label="Rename board"
              >
                {props.board.name}
              </button>
            }
          >
            <input
              class="rounded border border-accent bg-surface-2 px-3 py-1 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent"
              value={editValue()}
              onInput={(e) => setEditValue(e.currentTarget.value)}
              onBlur={commitEdit}
              onKeyDown={handleEditKeyDown}
              autofocus
            />
          </Show>
        </div>
      </div>

      {/* Right: Controls */}
      <div class="ml-auto flex items-center gap-2">
        {/* Preset selector */}
        <div class="relative">
          <button
            class="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
            onClick={() => setPresetsOpen((v) => !v)}
            aria-label="Board presets"
            aria-expanded={presetsOpen()}
          >
            Presets
            <ChevronDown size={14} />
          </button>

          <Show when={presetsOpen()}>
            {/* Clickaway backdrop */}
            <div
              class="fixed inset-0 z-10"
              onClick={() => setPresetsOpen(false)}
            />
            <div class="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-border bg-surface-2 py-1 shadow-lg">
              <For each={PRESET_BOARDS}>
                {(preset) => (
                  <button
                    class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-3 hover:text-text-primary transition-colors"
                    onClick={() => selectPreset(preset)}
                  >
                    <Show when={props.board.id === preset.id}>
                      <Check size={14} class="text-accent" />
                    </Show>
                    <Show when={props.board.id !== preset.id}>
                      <span class="w-3.5" />
                    </Show>
                    <div>
                      <div class="font-medium text-text-primary">
                        {preset.name}
                      </div>
                      <div class="text-[11px] text-text-secondary">
                        {preset.applets.length} applet
                        {preset.applets.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </button>
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* Add Applet toggle */}
        <button
          class="flex items-center gap-1.5 rounded-md bg-accent/15 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/25 transition-colors"
          onClick={props.onToggleCatalog}
          aria-label="Toggle applet catalog"
        >
          <PanelRightOpen size={14} />
          Add Applet
        </button>

        {/* Theme toggle */}
        <button
          class="rounded-md p-1.5 text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
          onClick={toggleTheme}
          aria-label={darkMode() ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <Show when={darkMode()} fallback={<Sun size={16} />}>
            <Moon size={16} />
          </Show>
        </button>
      </div>
    </header>
  );
}
