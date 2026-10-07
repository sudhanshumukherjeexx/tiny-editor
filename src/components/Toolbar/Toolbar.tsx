import { useRef } from 'react';
import type { Editor } from '@tiptap/react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Code,
  Ellipsis,
  Eraser,
  Highlighter,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  TextSelect,
  Underline,
  Undo2,
} from 'lucide-react';
import { useUI } from '../../app/ui';
import { useSettings } from '../../app/settings';
import { getFont } from '../../fonts/fonts';
import { setBlockType, type BlockType } from '../../editor/editorCommands';
import { shortcut } from '../../utils/platform';
import { IconButton } from '../ui/IconButton';
import { Popover } from '../ui/Popover';
import { FontList } from '../FontPicker/FontPicker';
import { KaomojiPicker } from '../KaomojiPicker/KaomojiPicker';
import { AlignButtons, FontSizeButtons, HighlightSwatches, InkSwatches } from './FormatPanels';
import { useToolbarState } from './useToolbarState';

const ICON = { size: 17, strokeWidth: 1.75 } as const;

const BLOCKS: { value: BlockType; label: string; sample: string }[] = [
  { value: 'paragraph', label: 'Paragraph', sample: 'Body text' },
  { value: 'h1', label: 'Heading 1', sample: 'Title' },
  { value: 'h2', label: 'Heading 2', sample: 'Section' },
  { value: 'h3', label: 'Heading 3', sample: 'Subsection' },
];

interface ToolbarProps {
  editor: Editor;
  onLink: () => void;
}

export function Toolbar({ editor, onLink }: ToolbarProps) {
  const state = useToolbarState(editor);
  const { openPanel, togglePanel, closePanel } = useUI();
  const { settings } = useSettings();

  const headingRef = useRef<HTMLButtonElement>(null);
  const highlightRef = useRef<HTMLButtonElement>(null);
  const alignRef = useRef<HTMLButtonElement>(null);
  const fontRef = useRef<HTMLButtonElement>(null);
  const stampsRef = useRef<HTMLButtonElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);

  const chain = () => editor.chain().focus();
  const AlignIcon = state.align === 'center' ? AlignCenter : state.align === 'right' ? AlignRight : AlignLeft;
  const blockLabel = BLOCKS.find((b) => b.value === state.block)?.label ?? 'Paragraph';

  return (
    <div className="toolbar-wrap">
      <div className="toolbar" role="toolbar" aria-label="Formatting">
        <div className="tb-group">
          <IconButton label="Undo" shortcut={shortcut('mod+z')} disabled={!state.canUndo} onClick={() => chain().undo().run()}>
            <Undo2 {...ICON} />
          </IconButton>
          <IconButton label="Redo" shortcut={shortcut('mod+shift+z')} disabled={!state.canRedo} onClick={() => chain().redo().run()}>
            <Redo2 {...ICON} />
          </IconButton>
        </div>

        <span className="tb-sep" aria-hidden="true" />

        <button
          ref={headingRef}
          type="button"
          className={`tb-select ${openPanel === 'heading' ? 'is-open' : ''}`}
          aria-haspopup="true"
          aria-expanded={openPanel === 'heading'}
          aria-label={`Text style: ${blockLabel}`}
          data-tip="Text style"
          onClick={() => togglePanel('heading')}
        >
          <span className="tb-select-text">{state.block === 'paragraph' ? 'Text' : state.block.toUpperCase()}</span>
          <ChevronDown size={13} strokeWidth={2} aria-hidden="true" />
        </button>

        <span className="tb-sep" aria-hidden="true" />

        <div className="tb-group">
          <IconButton label="Bold" shortcut={shortcut('mod+b')} active={state.bold} onClick={() => chain().toggleBold().run()}>
            <Bold {...ICON} />
          </IconButton>
          <IconButton label="Italic" shortcut={shortcut('mod+i')} active={state.italic} onClick={() => chain().toggleItalic().run()}>
            <Italic {...ICON} />
          </IconButton>
          <IconButton className="desk-only" label="Underline" shortcut={shortcut('mod+u')} active={state.underline} onClick={() => chain().toggleUnderline().run()}>
            <Underline {...ICON} />
          </IconButton>
          <IconButton className="desk-only" label="Strikethrough" shortcut={shortcut('mod+shift+x')} active={state.strike} onClick={() => chain().toggleStrike().run()}>
            <Strikethrough {...ICON} />
          </IconButton>
        </div>

        <span className="tb-sep" aria-hidden="true" />

        <div className="tb-group">
          <IconButton label="Bulleted list" shortcut={shortcut('mod+shift+8')} active={state.bulletList} onClick={() => chain().toggleBulletList().run()}>
            <List {...ICON} />
          </IconButton>
          <IconButton className="desk-only" label="Numbered list" shortcut={shortcut('mod+shift+7')} active={state.orderedList} onClick={() => chain().toggleOrderedList().run()}>
            <ListOrdered {...ICON} />
          </IconButton>
          <IconButton className="desk-only wide-only" label="Checklist" shortcut={shortcut('mod+shift+9')} active={state.taskList} onClick={() => chain().toggleTaskList().run()}>
            <ListTodo {...ICON} />
          </IconButton>
          <IconButton className="desk-only" label="Quote" shortcut={shortcut('mod+shift+b')} active={state.blockquote} onClick={() => chain().toggleBlockquote().run()}>
            <Quote {...ICON} />
          </IconButton>
        </div>

        <span className="tb-sep desk-only" aria-hidden="true" />

        <div className="tb-group desk-only">
          <IconButton
            ref={highlightRef}
            label="Highlight"
            shortcut={shortcut('mod+shift+h')}
            active={state.highlight}
            expanded={openPanel === 'highlight'}
            onClick={() => togglePanel('highlight')}
          >
            <Highlighter {...ICON} />
          </IconButton>
          <IconButton label="Link" shortcut={shortcut('mod+k')} active={state.link} onClick={onLink}>
            <LinkIcon {...ICON} />
          </IconButton>
          <IconButton ref={alignRef} label="Alignment" expanded={openPanel === 'align'} onClick={() => togglePanel('align')}>
            <AlignIcon {...ICON} />
          </IconButton>
        </div>

        <span className="tb-sep desk-only" aria-hidden="true" />

        <button
          ref={fontRef}
          type="button"
          className={`tb-select tb-font desk-only ${openPanel === 'font' ? 'is-open' : ''}`}
          aria-haspopup="true"
          aria-expanded={openPanel === 'font'}
          aria-label={`Font: ${getFont(settings.fontId).label}`}
          data-tip="Font"
          onClick={() => togglePanel('font')}
        >
          <span style={{ fontFamily: getFont(settings.fontId).family }}>Aa</span>
          <ChevronDown size={13} strokeWidth={2} aria-hidden="true" />
        </button>

        <button
          ref={stampsRef}
          type="button"
          className={`tb-select tb-kaomoji desk-only ${openPanel === 'stamps' ? 'is-open' : ''}`}
          aria-haspopup="true"
          aria-expanded={openPanel === 'stamps'}
          aria-label="Kaomoji and symbols"
          data-tip="Kaomoji & symbols"
          onClick={() => togglePanel('stamps')}
        >
          <span aria-hidden="true">(˶ᵔᵕᵔ˶)</span>
        </button>

        <span className="tb-sep" aria-hidden="true" />

        <IconButton ref={moreRef} label="More formatting" expanded={openPanel === 'more'} onClick={() => togglePanel('more')}>
          <Ellipsis {...ICON} />
        </IconButton>
      </div>

      <Popover open={openPanel === 'heading'} onClose={closePanel} anchor={headingRef} label="Text style" role="menu" className="menu">
        {BLOCKS.map((b) => (
          <button
            key={b.value}
            type="button"
            role="menuitemradio"
            aria-checked={state.block === b.value}
            className={`menu-item block-option block-${b.value} ${state.block === b.value ? 'is-selected' : ''}`}
            onClick={() => {
              setBlockType(editor, b.value);
              closePanel();
            }}
          >
            <span className="block-sample">{b.sample}</span>
            <span className="menu-hint">{b.label}</span>
          </button>
        ))}
      </Popover>

      <Popover open={openPanel === 'highlight'} onClose={closePanel} anchor={highlightRef} label="Highlighter">
        <div className="panel-body tight">
          <p className="panel-label">Highlighter</p>
          <HighlightSwatches editor={editor} state={state} />
          <p className="panel-label">Ink</p>
          <InkSwatches editor={editor} state={state} />
        </div>
      </Popover>

      <Popover open={openPanel === 'align'} onClose={closePanel} anchor={alignRef} label="Alignment" align="center">
        <div className="panel-body tight">
          <AlignButtons editor={editor} state={state} onDone={closePanel} />
        </div>
      </Popover>

      <Popover open={openPanel === 'font'} onClose={closePanel} anchor={fontRef} label="Document font" className="w-font">
        <div className="panel-body">
          <p className="panel-label">Document font</p>
          <FontList onPick={closePanel} />
        </div>
      </Popover>

      <Popover open={openPanel === 'stamps'} onClose={closePanel} anchor={stampsRef} label="Kaomoji and symbols" align="center" className="w-stamps">
        <KaomojiPicker editor={editor} />
      </Popover>

      <Popover open={openPanel === 'more'} onClose={closePanel} anchor={moreRef} label="More formatting" align="end" className="w-more">
        <div className="panel-body">
          <div className="mobile-only">
            <p className="panel-label">Style</p>
            <div className="seg-buttons wrap">
              <IconButton label="Underline" active={state.underline} onClick={() => chain().toggleUnderline().run()}>
                <Underline {...ICON} />
              </IconButton>
              <IconButton label="Strikethrough" active={state.strike} onClick={() => chain().toggleStrike().run()}>
                <Strikethrough {...ICON} />
              </IconButton>
              <IconButton label="Numbered list" active={state.orderedList} onClick={() => chain().toggleOrderedList().run()}>
                <ListOrdered {...ICON} />
              </IconButton>
              <IconButton label="Quote" active={state.blockquote} onClick={() => chain().toggleBlockquote().run()}>
                <Quote {...ICON} />
              </IconButton>
              <IconButton
                label="Link"
                active={state.link}
                onClick={() => {
                  closePanel();
                  onLink();
                }}
              >
                <LinkIcon {...ICON} />
              </IconButton>
            </div>
            <p className="panel-label">Align</p>
            <AlignButtons editor={editor} state={state} />
            <p className="panel-label">Highlighter</p>
            <HighlightSwatches editor={editor} state={state} />
          </div>

          <p className="panel-label">Insert</p>
          <div className="seg-buttons wrap">
            <IconButton label="Checklist" active={state.taskList} onClick={() => chain().toggleTaskList().run()}>
              <ListTodo {...ICON} />
            </IconButton>
            <IconButton label="Inline code" shortcut={shortcut('mod+e')} active={state.code} onClick={() => chain().toggleCode().run()}>
              <Code {...ICON} />
            </IconButton>
            <IconButton label="Code block" active={state.codeBlock} onClick={() => chain().toggleCodeBlock().run()}>
              <SquareCode {...ICON} />
            </IconButton>
            <IconButton label="Divider" onClick={() => chain().setHorizontalRule().run()}>
              <Minus {...ICON} />
            </IconButton>
          </div>

          <p className="panel-label">Ink</p>
          <InkSwatches editor={editor} state={state} />

          <p className="panel-label">Size</p>
          <FontSizeButtons editor={editor} state={state} />

          <div className="mobile-only">
            <p className="panel-label">Font</p>
            <FontList />
            <p className="panel-label">Kaomoji</p>
            <KaomojiPicker editor={editor} />
          </div>

          <div className="menu-divider" />
          <button type="button" className="menu-item compact" onClick={() => chain().unsetAllMarks().clearNodes().run()}>
            <Eraser size={15} strokeWidth={1.75} aria-hidden="true" />
            <span>Clear formatting</span>
          </button>
          <button
            type="button"
            className="menu-item compact"
            onClick={() => {
              chain().selectAll().run();
              closePanel();
            }}
          >
            <TextSelect size={15} strokeWidth={1.75} aria-hidden="true" />
            <span>Select all</span>
            <kbd className="menu-kbd">{shortcut('mod+a')}</kbd>
          </button>
        </div>
      </Popover>
    </div>
  );
}
