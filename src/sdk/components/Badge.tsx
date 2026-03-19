// ============================================================================
// Badge — Colored badge/pill
// ============================================================================

import { JSX } from 'solid-js';

interface BadgeProps {
  text: string;
  variant?: 'danger' | 'warning' | 'success' | 'info' | 'default';
  size?: 'sm' | 'md';
}

const VARIANT_CLASSES: Record<string, string> = {
  danger: 'bg-red-900/60 text-red-300',
  warning: 'bg-amber-900/60 text-amber-300',
  success: 'bg-emerald-900/60 text-emerald-300',
  info: 'bg-blue-900/60 text-blue-300',
  default: 'bg-surface-3 text-text-secondary',
};

const SIZE_CLASSES: Record<string, string> = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
};

export function Badge(props: BadgeProps): JSX.Element {
  const variant = () => props.variant ?? 'default';
  const size = () => props.size ?? 'sm';

  return (
    <span
      class={`inline-block font-semibold uppercase rounded ${VARIANT_CLASSES[variant()]} ${SIZE_CLASSES[size()]}`}
    >
      {props.text}
    </span>
  );
}
