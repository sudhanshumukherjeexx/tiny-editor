import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { EditorContent, useEditorState, type Editor } from '@tiptap/react';
import { COPY } from '../app/copy';
import type { Settings } from '../app/settings';
import { getFont } from '../fonts/fonts';

const WIDTHS = { narrow: '640px', normal: '780px', wide: '940px' } as const;
const LINE_HEIGHTS = { snug: 1.55, cozy: 1.8, airy: 2.05 } as const;
const TEXT_SIZES = { small: '16px', medium: '18px', large: '20px' } as const;

interface PaperProps {
  editor: Editor;
  settings: Settings;
  title: string;
  onTitleChange: (title: string) => void;
  dateLabel: string;
}

/** The writing sheet: date, title, and the continuous editor surface. */
export function Paper({ editor, settings, title, onTitleChange, dateLabel }: PaperProps) {
  const isEmpty = useEditorState({ editor, selector: ({ editor: e }) => e.isEmpty });
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the title field so long titles wrap instead of scrolling.
  useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [title, settings.fontId, settings.textSize, settings.width]);

  const style = {
    '--doc-font': getFont(settings.fontId).family,
    '--paper-width': WIDTHS[settings.width],
    '--doc-line-height': LINE_HEIGHTS[settings.lineHeight],
    '--doc-size': TEXT_SIZES[settings.textSize],
  } as CSSProperties;

  const classes = [
    'paper',
    `paper-${settings.paper}`,
    settings.paperTexture ? 'has-grain' : '',
    `caret-${settings.caret}`,
    settings.focusParagraph ? 'dim-others' : '',
    settings.typewriterMode ? 'typewriter-mode' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={classes} style={style}>
      <span className="washi" aria-hidden="true" />
      <span className="paper-corner" aria-hidden="true" />
      <header className="paper-head">
        {dateLabel && (
          <p className="doc-date">
            <time dateTime={new Date().toISOString().slice(0, 10)}>{dateLabel}</time>
          </p>
        )}
        <textarea
          ref={titleRef}
          className="doc-title"
          rows={1}
          value={title}
          maxLength={120}
          spellCheck={false}
          aria-label="Document title"
          placeholder="Untitled"
          onChange={(e) => onTitleChange(e.target.value.replace(/\n/g, ' '))}
          onFocus={(e) => {
            if (e.target.value === 'Untitled') e.target.select();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || (e.key === 'ArrowDown' && !e.shiftKey)) {
              e.preventDefault();
              editor.commands.focus('start');
            }
          }}
        />
        <p className={`empty-ja ${isEmpty ? '' : 'is-hidden'}`} aria-hidden="true">
          {COPY.placeholderJa}
        </p>
      </header>
      <EditorContent editor={editor} className="doc-body" />
    </article>
  );
}
