import type { Editor } from '@tiptap/react';

/**
 * Small, named editor actions shared by the toolbar, floating toolbar,
 * slash menu and command palette.
 */
export type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3';

export function getBlockType(editor: Editor): BlockType {
  for (const level of [1, 2, 3] as const) if (editor.isActive('heading', { level })) return `h${level}`;
  return 'paragraph';
}

export function setBlockType(editor: Editor, type: BlockType) {
  const chain = editor.chain().focus();
  if (type === 'paragraph') chain.setParagraph().run();
  else chain.setHeading({ level: Number(type[1]) as 1 | 2 | 3 }).run();
}

export function insertText(editor: Editor, text: string) {
  // Insert as a text node so characters like "<3" are never parsed as HTML.
  editor.chain().focus().insertContent({ type: 'text', text }).run();
}

export function setLink(editor: Editor, href: string) {
  const { from, to } = editor.state.selection;
  const hasText = editor.state.doc.textBetween(from, to, ' ').trim().length > 0;
  if (!hasText && !editor.isActive('link')) {
    editor
      .chain()
      .focus()
      .insertContent({ type: 'text', text: href.replace(/^mailto:/, ''), marks: [{ type: 'link', attrs: { href } }] })
      .run();
    return;
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
}

export function removeLink(editor: Editor) {
  editor.chain().focus().extendMarkRange('link').unsetLink().run();
}

export function toggleHighlight(editor: Editor, color?: string) {
  if (!color) {
    editor.chain().focus().unsetHighlight().run();
    return;
  }
  if (editor.isActive('highlight', { color })) editor.chain().focus().unsetHighlight().run();
  else editor.chain().focus().setHighlight({ color }).run();
}

/** Bounding rectangle of the current selection, for anchoring popovers. */
export function selectionRect(editor: Editor): DOMRect {
  const { from, to } = editor.state.selection;
  const start = editor.view.coordsAtPos(from);
  const end = editor.view.coordsAtPos(to);
  const top = Math.min(start.top, end.top);
  const bottom = Math.max(start.bottom, end.bottom);
  const left = start.top === end.top ? Math.min(start.left, end.left) : start.left;
  const right = start.top === end.top ? Math.max(start.right, end.right) : start.right + 1;
  return new DOMRect(left, top, Math.max(1, right - left), bottom - top);
}
