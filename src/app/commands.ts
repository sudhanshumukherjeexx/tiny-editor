import type { Editor } from '@tiptap/react';
import type { Command } from '../components/CommandPalette/CommandPalette';
import type { Exporter } from '../hooks/useExporter';
import { THEMES } from '../themes/themes';
import { FONTS, ensureFontLoaded } from '../fonts/fonts';
import { shortcut } from '../utils/platform';
import type { Settings } from './settings';
import type { PanelId } from './ui';

interface CommandDeps {
  editor: Editor;
  exporter: Exporter;
  update: (patch: Partial<Settings>) => void;
  toggle: (key: 'focusMode' | 'typewriterMode' | 'focusParagraph' | 'sound') => void;
  openPanel: (id: PanelId | null) => void;
  startTimer: (minutes: number) => void;
}

export function buildCommands({ editor, exporter, update, toggle, openPanel, startTimer }: CommandDeps): Command[] {
  return [
    { id: 'focus', group: 'View', label: 'Toggle focus mode', hint: shortcut('mod+shift+f'), run: () => toggle('focusMode') },
    { id: 'typewriter', group: 'Writing', label: 'Toggle typewriter mode', run: () => toggle('typewriterMode') },
    { id: 'focus-para', group: 'Writing', label: 'Toggle focus current paragraph', run: () => toggle('focusParagraph') },
    { id: 'goal', group: 'Writing', label: 'Set writing goal…', run: () => openPanel('mood') },
    { id: 'timer-25', group: 'Writing', label: 'Start a 25 minute timer', run: () => startTimer(25) },
    { id: 'sound', group: 'Writing', label: 'Toggle typewriter sound', run: () => toggle('sound') },
    { id: 'export', group: 'Export', label: 'Open export menu', hint: shortcut('mod+shift+s'), run: () => openPanel('export') },
    { id: 'pdf', group: 'Export', label: 'PDF / Print', run: () => exporter.print() },
    { id: 'md', group: 'Export', label: 'Download Markdown', run: () => exporter.download('markdown') },
    { id: 'txt', group: 'Export', label: 'Download plain text', run: () => exporter.download('text') },
    { id: 'html', group: 'Export', label: 'Download HTML', run: () => exporter.download('html') },
    { id: 'copy-md', group: 'Export', label: 'Copy Markdown', run: () => void exporter.copyMarkdown() },
    { id: 'copy-txt', group: 'Export', label: 'Copy text', run: () => void exporter.copyPlainText() },
    ...THEMES.map((t) => ({ id: `theme-${t.id}`, group: 'Theme', label: t.name, run: () => update({ themeId: t.id }) })),
    ...FONTS.map((f) => ({
      id: `font-${f.id}`,
      group: 'Font',
      label: f.label,
      run: () => {
        void ensureFontLoaded(f.id);
        update({ fontId: f.id });
      },
    })),
    ...(['plain', 'ruled', 'grid', 'dots', 'letter'] as const).map((p) => ({
      id: `paper-${p}`,
      group: 'Paper',
      label: p[0].toUpperCase() + p.slice(1),
      run: () => update({ paper: p }),
    })),
    { id: 'select-all', group: 'Edit', label: 'Select all', hint: shortcut('mod+a'), run: () => editor.chain().focus().selectAll().run() },
  ];
}
