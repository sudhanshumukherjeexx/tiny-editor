import { useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Bold, Highlighter, Italic, Link as LinkIcon, Underline } from 'lucide-react';
import { useUI } from '../../app/ui';
import { HIGHLIGHT_COLORS } from '../../themes/palettes';
import { toggleHighlight } from '../../editor/editorCommands';
import { shortcut } from '../../utils/platform';
import { IconButton } from '../ui/IconButton';
import { useToolbarState } from '../Toolbar/useToolbarState';

const ICON = { size: 15, strokeWidth: 2 } as const;

/** Tiny contextual toolbar that appears over selected text. */
export function FloatingToolbar({ editor, onLink }: { editor: Editor; onLink: () => void }) {
  const state = useToolbarState(editor);
  const { openPanel } = useUI();
  // The menu plugin keeps its first shouldShow, so read live state from a ref.
  const linkOpen = useRef(false);
  linkOpen.current = openPanel === 'link';
  const chain = () => editor.chain().focus();

  return (
    <BubbleMenu
      editor={editor}
      className="bubble"
      options={{ placement: 'top', offset: 10 }}
      shouldShow={({ editor: e, element, from, to }) =>
        from !== to &&
        e.isEditable &&
        (e.view.hasFocus() || element.contains(document.activeElement)) &&
        !e.isActive('codeBlock') &&
        !linkOpen.current
      }
    >
      <IconButton label="Bold" shortcut={shortcut('mod+b')} active={state.bold} onClick={() => chain().toggleBold().run()}>
        <Bold {...ICON} />
      </IconButton>
      <IconButton label="Italic" shortcut={shortcut('mod+i')} active={state.italic} onClick={() => chain().toggleItalic().run()}>
        <Italic {...ICON} />
      </IconButton>
      <IconButton label="Underline" shortcut={shortcut('mod+u')} active={state.underline} onClick={() => chain().toggleUnderline().run()}>
        <Underline {...ICON} />
      </IconButton>
      <IconButton
        label="Highlight"
        shortcut={shortcut('mod+shift+h')}
        active={state.highlight}
        onClick={() => toggleHighlight(editor, state.highlightColor ?? HIGHLIGHT_COLORS[0].value)}
      >
        <Highlighter {...ICON} />
      </IconButton>
      <span className="tb-sep" aria-hidden="true" />
      <IconButton label="Link" shortcut={shortcut('mod+k')} active={state.link} onClick={onLink}>
        <LinkIcon {...ICON} />
      </IconButton>
    </BubbleMenu>
  );
}
