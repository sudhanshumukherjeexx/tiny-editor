import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, type Editor } from '@tiptap/react';
import { createExtensions } from './editorExtensions';
import { filterSlashItems, findSlashMatch, type SlashItem, type SlashMatch } from './slashCommands';
import { getTextStats, type TextStats } from '../utils/textStats';
import { prefersReducedMotion } from '../utils/platform';

interface Options {
  onModK: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onKawaii: () => void;
  typewriterMode: boolean;
}

export interface SlashState {
  match: SlashMatch;
  items: SlashItem[];
  index: number;
}

const EMPTY_STATS: TextStats = { words: 0, characters: 0, readingMinutes: 0 };

/**
 * Creates the Tiptap editor and wires up the behaviours that sit around it:
 * live stats, the slash menu, typewriter scrolling and the tiny easter egg.
 * The document lives only in this editor instance — never in storage.
 */
export function useKakuEditor({ onModK, onKeyDown, onKawaii, typewriterMode }: Options) {
  const handlers = useRef({ onModK, onKeyDown, onKawaii, typewriterMode });
  handlers.current = { onModK, onKeyDown, onKawaii, typewriterMode };

  const [stats, setStats] = useState<TextStats>(EMPTY_STATS);
  const [slash, setSlash] = useState<SlashState | null>(null);
  const slashRef = useRef<SlashState | null>(null);
  slashRef.current = slash;
  /** Position where the user dismissed the slash menu with Escape. */
  const dismissedAt = useRef<number | null>(null);
  const statsTimer = useRef(0);

  const runSlash = useCallback((editor: Editor, item: SlashItem) => {
    const current = slashRef.current;
    if (!current) return;
    item.run(editor, { from: current.match.from, to: current.match.to });
    setSlash(null);
  }, []);

  const editor = useEditor({
    extensions: createExtensions({ onModK: () => handlers.current.onModK() }),
    autofocus: 'end',
    editorProps: {
      attributes: {
        class: 'kaku-prose',
        'aria-label': 'Document',
        'aria-multiline': 'true',
        role: 'textbox',
        spellcheck: 'true',
      },
      handleKeyDown: (_view, event) => {
        handlers.current.onKeyDown(event);
        const s = slashRef.current;
        if (!s || s.items.length === 0) return false;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          const delta = event.key === 'ArrowDown' ? 1 : -1;
          setSlash({ ...s, index: (s.index + delta + s.items.length) % s.items.length });
          return true;
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          const item = s.items[s.index];
          if (item && editorRef.current) runSlash(editorRef.current, item);
          return true;
        }
        if (event.key === 'Escape') {
          dismissedAt.current = s.match.from;
          setSlash(null);
          return true;
        }
        return false;
      },
    },
  });

  const editorRef = useRef<Editor | null>(null);
  editorRef.current = editor;

  // Slash menu, stats, easter egg and typewriter scrolling.
  useEffect(() => {
    if (!editor) return;

    const updateSlash = () => {
      const match = findSlashMatch(editor);
      if (!match || dismissedAt.current === match.from) {
        if (!match) dismissedAt.current = null;
        setSlash(null);
        return;
      }
      const items = filterSlashItems(match.query);
      setSlash((prev) => ({ match, items, index: prev && prev.match.from === match.from ? Math.min(prev.index, Math.max(0, items.length - 1)) : 0 }));
    };

    let scrollFrame = 0;
    const centerCaret = () => {
      if (!handlers.current.typewriterMode || !editor.isFocused) return;
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => {
        const { head } = editor.state.selection;
        const coords = editor.view.coordsAtPos(head);
        const target = window.innerHeight * 0.45;
        const delta = coords.top - target;
        // Only move for real line changes to avoid jitter while typing.
        if (Math.abs(delta) > 12) window.scrollBy({ top: delta, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      });
    };

    const onUpdate = () => {
      updateSlash();
      centerCaret();
      window.clearTimeout(statsTimer.current);
      statsTimer.current = window.setTimeout(() => setStats(getTextStats(editor.getText({ blockSeparator: '\n' }))), 120);

      const { $from } = editor.state.selection;
      const before = $from.parent.textBetween(Math.max(0, $from.parentOffset - 6), $from.parentOffset, undefined, '￼');
      if (before.toLowerCase() === 'kawaii') handlers.current.onKawaii();
    };

    const onSelection = () => {
      updateSlash();
      centerCaret();
    };

    const onBlur = () => setSlash(null);

    editor.on('update', onUpdate);
    editor.on('selectionUpdate', onSelection);
    editor.on('blur', onBlur);
    return () => {
      editor.off('blur', onBlur);
      cancelAnimationFrame(scrollFrame);
      window.clearTimeout(statsTimer.current);
      editor.off('update', onUpdate);
      editor.off('selectionUpdate', onSelection);
    };
  }, [editor]);

  return { editor, stats, slash, setSlashIndex: (index: number) => slash && setSlash({ ...slash, index }), runSlash };
}
