import type { Editor } from '@tiptap/react';
import { AlignCenter, AlignLeft, AlignRight, Check } from 'lucide-react';
import { HIGHLIGHT_COLORS, INK_COLORS } from '../../themes/palettes';
import { toggleHighlight } from '../../editor/editorCommands';
import type { ToolbarState } from './useToolbarState';

interface PanelProps {
  editor: Editor;
  state: ToolbarState;
}

export function HighlightSwatches({ editor, state }: PanelProps) {
  return (
    <div className="swatch-row" role="group" aria-label="Highlighter">
      {HIGHLIGHT_COLORS.map((c) => {
        const active = state.highlightColor === c.value;
        return (
          <button
            key={c.id}
            type="button"
            className={`swatch ${active ? 'is-active' : ''}`}
            style={{ background: c.value }}
            aria-label={`${c.name} highlight`}
            aria-pressed={active}
            data-tip={c.name}
            onClick={() => toggleHighlight(editor, c.value)}
          >
            {active && <Check size={12} strokeWidth={2.5} />}
          </button>
        );
      })}
      <button type="button" className="swatch swatch-none" aria-label="Remove highlight" data-tip="No highlight" onClick={() => toggleHighlight(editor)}>
        <span aria-hidden="true">⌀</span>
      </button>
    </div>
  );
}

export function InkSwatches({ editor, state }: PanelProps) {
  return (
    <div className="swatch-row" role="group" aria-label="Text colour">
      {INK_COLORS.map((c) => {
        const active = c.id === 'charcoal' ? !state.color || state.color === c.value : state.color === c.value;
        return (
          <button
            key={c.id}
            type="button"
            className={`swatch swatch-ink ${active ? 'is-active' : ''}`}
            aria-label={`${c.name} text`}
            aria-pressed={active}
            data-tip={c.name}
            onClick={() =>
              c.id === 'charcoal' ? editor.chain().focus().unsetColor().run() : editor.chain().focus().setColor(c.value).run()
            }
          >
            <span style={{ color: c.value }}>A</span>
          </button>
        );
      })}
    </div>
  );
}

const ALIGNMENTS = [
  { value: 'left', label: 'Align left', Icon: AlignLeft },
  { value: 'center', label: 'Align center', Icon: AlignCenter },
  { value: 'right', label: 'Align right', Icon: AlignRight },
] as const;

export function AlignButtons({ editor, state, onDone }: PanelProps & { onDone?: () => void }) {
  return (
    <div className="seg-buttons" role="group" aria-label="Alignment">
      {ALIGNMENTS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          className={`tb-btn ${state.align === value ? 'is-active' : ''}`}
          aria-label={label}
          aria-pressed={state.align === value}
          data-tip={label}
          onClick={() => {
            editor.chain().focus().setTextAlign(value).run();
            onDone?.();
          }}
        >
          <Icon size={16} strokeWidth={1.75} />
        </button>
      ))}
    </div>
  );
}

const SIZES = [
  { value: '0.85em', label: 'S', name: 'Small' },
  { value: null, label: 'M', name: 'Normal' },
  { value: '1.25em', label: 'L', name: 'Large' },
  { value: '1.6em', label: 'XL', name: 'Extra large' },
] as const;

export function FontSizeButtons({ editor, state }: PanelProps) {
  return (
    <div className="seg-buttons" role="group" aria-label="Text size">
      {SIZES.map((s) => {
        const active = (state.fontSize ?? null) === s.value;
        return (
          <button
            key={s.label}
            type="button"
            className={`tb-btn tb-text ${active ? 'is-active' : ''}`}
            aria-label={`${s.name} text`}
            aria-pressed={active}
            data-tip={s.name}
            onClick={() =>
              s.value ? editor.chain().focus().setFontSize(s.value).run() : editor.chain().focus().unsetFontSize().run()
            }
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
