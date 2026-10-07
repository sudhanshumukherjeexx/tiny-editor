import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Editor } from '@tiptap/react';
import type { SlashState } from '../../editor/useKakuEditor';
import type { SlashItem } from '../../editor/slashCommands';

interface SlashMenuProps {
  editor: Editor;
  slash: SlashState | null;
  onSelect: (item: SlashItem) => void;
  onHover: (index: number) => void;
}

/** The small "/" block menu shown under the caret. */
export function SlashMenu({ editor, slash, onSelect, onHover }: SlashMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!slash) return;
    const coords = editor.view.coordsAtPos(slash.match.from);
    const h = ref.current?.offsetHeight ?? 240;
    const w = ref.current?.offsetWidth ?? 220;
    let top = coords.bottom + 6;
    if (top + h > window.innerHeight - 8) top = Math.max(8, coords.top - h - 6);
    const left = Math.min(Math.max(8, coords.left - 4), window.innerWidth - w - 8);
    setPos({ top, left });
  }, [editor, slash]);

  useLayoutEffect(() => {
    ref.current?.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' });
  }, [slash?.index]);

  if (!slash) return null;

  return createPortal(
    <div
      ref={ref}
      className="slash-menu"
      role="listbox"
      aria-label="Insert block"
      style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {slash.items.length === 0 ? (
        <p className="slash-empty">nothing for “{slash.match.query}”</p>
      ) : (
        slash.items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={i === slash.index}
            className={`slash-item ${i === slash.index ? 'is-active' : ''}`}
            onMouseEnter={() => onHover(i)}
            onClick={() => onSelect(item)}
          >
            <span className="slash-glyph" aria-hidden="true">
              {item.glyph}
            </span>
            <span className="slash-label">{item.label}</span>
            <span className="slash-hint">{item.hint}</span>
          </button>
        ))
      )}
    </div>,
    document.body,
  );
}
