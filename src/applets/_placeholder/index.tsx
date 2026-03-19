// ============================================================================
// PLACEHOLDER APPLET — Generic "Coming Soon" component for unfinished applets
// ============================================================================

import type { Component } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';

export const manifest: AppletManifest = {
  id: '_placeholder',
  name: 'Coming Soon',
  description: 'This applet is under development',
  category: 'utility',
  icon: 'construction',
  defaultSize: { w: 3, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
};

const Placeholder: Component<AppletProps> = (_props) => {
  return (
    <div class="flex flex-col items-center justify-center h-full bg-surface-1 text-text-secondary gap-3 p-4">
      <div class="w-12 h-12 rounded-full bg-surface-3 flex items-center justify-center text-2xl">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-warning"
        >
          <rect x="2" y="6" width="20" height="8" rx="1" />
          <path d="M17 14v7" />
          <path d="M7 14v7" />
          <path d="M17 3v3" />
          <path d="M7 3v3" />
          <path d="M10 14L2.3 6.3" />
          <path d="m14 6 7.7 7.7" />
          <path d="m8 6 8 8" />
        </svg>
      </div>
      <h3 class="text-sm font-semibold text-text-primary">Coming Soon</h3>
      <p class="text-xs text-center max-w-xs">
        This applet is under development. Check back soon or build your own
        using the Applet SDK.
      </p>
    </div>
  );
};

export default Placeholder;
