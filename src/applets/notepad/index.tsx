// ============================================================================
// NOTEPAD — Simple text notepad with persistent storage
// ============================================================================

import { Component, createMemo } from 'solid-js';
import type { AppletProps, AppletManifest } from '../../core/applet.contract';
import { AppletShell, useAppletState } from '../../sdk';

export const manifest: AppletManifest = {
  id: 'notepad',
  name: 'Notepad',
  description: 'Simple persistent text notepad',
  category: 'utility',
  icon: 'file-text',
  defaultSize: { w: 2, h: 3 },
  minSize: { w: 2, h: 2 },
  resizable: true,
};

const Notepad: Component<AppletProps> = (props) => {
  const [state, setState] = useAppletState(props, { content: '' });

  const charCount = createMemo(() => state().content.length);
  const wordCount = createMemo(() => {
    const text = state().content.trim();
    return text.length === 0 ? 0 : text.split(/\s+/).length;
  });
  const lineCount = createMemo(() => {
    const text = state().content;
    return text.length === 0 ? 0 : text.split('\n').length;
  });

  return (
    <AppletShell
      title="Notepad"
      headerRight={
        <div class="flex items-center gap-3 text-[10px] text-text-secondary tabular-nums">
          <span>{charCount()} chars</span>
          <span>{wordCount()} words</span>
          <span>{lineCount()} lines</span>
        </div>
      }
    >
      <textarea
        value={state().content}
        onInput={(e) => setState({ content: e.currentTarget.value })}
        placeholder="Start typing..."
        spellcheck={false}
        class="w-full h-full bg-surface-2 text-text-primary text-sm font-mono p-3 resize-none focus:outline-none placeholder:text-text-secondary border-none"
        style={{ 'min-height': '100%' }}
      />
    </AppletShell>
  );
};

export default Notepad;
