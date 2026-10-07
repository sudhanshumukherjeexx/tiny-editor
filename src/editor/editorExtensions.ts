import { Extension, type AnyExtension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { Color, FontSize, TextStyle } from '@tiptap/extension-text-style';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Placeholder } from '@tiptap/extensions';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { COPY } from '../app/copy';
import { isSafeHref } from '../utils/url';

/**
 * Marks the top-level block that contains the caret with `is-active-block`,
 * which typewriter mode uses to gently dim the surrounding paragraphs.
 */
const ActiveBlock = Extension.create({
  name: 'activeBlock',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('activeBlock'),
        props: {
          decorations(state) {
            const { $head } = state.selection;
            if ($head.depth < 1) return null;
            const from = $head.before(1);
            const node = state.doc.nodeAt(from);
            if (!node) return null;
            return DecorationSet.create(state.doc, [Decoration.node(from, from + node.nodeSize, { class: 'is-active-block' })]);
          },
        },
      }),
    ];
  },
});

export interface ShortcutHandlers {
  /** Cmd/Ctrl+K: link when text is selected, command palette otherwise. */
  onModK: () => void;
}

function createShortcuts(handlers: ShortcutHandlers) {
  return Extension.create({
    name: 'kakuShortcuts',
    addKeyboardShortcuts() {
      return {
        'Mod-k': () => {
          handlers.onModK();
          return true;
        },
        // Mod-Shift-S is reserved for the export menu, so strike moves here.
        'Mod-Shift-x': () => this.editor.commands.toggleStrike(),
      };
    },
  });
}

export function createExtensions(handlers: ShortcutHandlers): AnyExtension[] {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      dropcursor: { width: 2, class: 'kaku-dropcursor' },
      link: {
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: 'https',
        protocols: ['mailto', 'tel'],
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
        isAllowedUri: (url, ctx) => ctx.defaultValidate(url) && isSafeHref(/^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`),
      },
    }),
    TextStyle,
    Color,
    FontSize,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right'] }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({
      placeholder: ({ editor, node }) => {
        if (editor.isEmpty) return COPY.placeholder;
        if (node.type.name === 'heading') return `Heading ${node.attrs.level}`;
        return '';
      },
    }),
    ActiveBlock,
    createShortcuts(handlers),
  ];
}
