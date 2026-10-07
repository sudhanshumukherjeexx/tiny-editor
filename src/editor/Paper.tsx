import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from 'react';
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
  /** False while another sheet is shown. */
  active: boolean;
}

/** Class names and CSS variables shared by every sheet (note or to-do list). */
export function paperLook(settings: Settings, extra: string[] = []): { className: string; style: CSSProperties } {
  const style = {
    '--doc-font': getFont(settings.fontId).family,
    '--paper-width': WIDTHS[settings.width],
    '--doc-line-height': LINE_HEIGHTS[settings.lineHeight],
    '--doc-size': TEXT_SIZES[settings.textSize],
  } as CSSProperties;
  const className = ['paper', `paper-${settings.paper}`, settings.paperTexture ? 'has-grain' : '', `caret-${settings.caret}`, ...extra]
    .filter(Boolean)
    .join(' ');
  return { className, style };
}

/**
 * Auto-grows a textarea so long text wraps instead of scrolling. Include
 * the sheet's visibility in `deps`: a hidden field can't be measured, so it
 * is skipped and measured again once shown.
 */
export function useAutoHeight(ref: RefObject<HTMLTextAreaElement | null>, deps: unknown[]) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || el.getClientRects().length === 0) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, deps);
}

/** The writing sheet: date, title, and the continuous editor surface. */
export function Paper({ editor, settings, title, onTitleChange, dateLabel, active }: PaperProps) {
  const isEmpty = useEditorState({ editor, selector: ({ editor: e }) => e.isEmpty });
  const titleRef = useRef<HTMLTextAreaElement>(null);
  useAutoHeight(titleRef, [title, settings.fontId, settings.textSize, settings.width, active]);

  const { className, style } = paperLook(settings, [
    settings.focusParagraph ? 'dim-others' : '',
    settings.typewriterMode ? 'typewriter-mode' : '',
  ]);

  return (
    <article className={className} style={style}>
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
