import type { Editor } from '@tiptap/react';

export interface SlashItem {
  id: string;
  label: string;
  hint: string;
  glyph: string;
  keywords: string;
  run: (editor: Editor, range: { from: number; to: number }) => void;
}

const chainAt = (editor: Editor, range: { from: number; to: number }) => editor.chain().focus().deleteRange(range);

/** Intentionally small: just the blocks people reach for most. */
export const SLASH_ITEMS: SlashItem[] = [
  { id: 'h1', label: 'Heading 1', hint: '#', glyph: 'H1', keywords: 'title big', run: (e, r) => chainAt(e, r).setHeading({ level: 1 }).run() },
  { id: 'h2', label: 'Heading 2', hint: '##', glyph: 'H2', keywords: 'subtitle', run: (e, r) => chainAt(e, r).setHeading({ level: 2 }).run() },
  { id: 'h3', label: 'Heading 3', hint: '###', glyph: 'H3', keywords: 'small', run: (e, r) => chainAt(e, r).setHeading({ level: 3 }).run() },
  { id: 'bullet', label: 'Bulleted list', hint: '-', glyph: '•', keywords: 'ul unordered', run: (e, r) => chainAt(e, r).toggleBulletList().run() },
  { id: 'ordered', label: 'Numbered list', hint: '1.', glyph: '1.', keywords: 'ol ordered', run: (e, r) => chainAt(e, r).toggleOrderedList().run() },
  { id: 'task', label: 'Checklist', hint: '[ ]', glyph: '☐', keywords: 'todo task check', run: (e, r) => chainAt(e, r).toggleTaskList().run() },
  { id: 'quote', label: 'Quote', hint: '>', glyph: '❝', keywords: 'blockquote', run: (e, r) => chainAt(e, r).toggleBlockquote().run() },
  { id: 'divider', label: 'Divider', hint: '---', glyph: '✿', keywords: 'hr rule line separator', run: (e, r) => chainAt(e, r).setHorizontalRule().run() },
  { id: 'code', label: 'Code block', hint: '```', glyph: '<>', keywords: 'pre snippet', run: (e, r) => chainAt(e, r).toggleCodeBlock().run() },
];

export function filterSlashItems(query: string): SlashItem[] {
  const q = query.toLowerCase();
  if (!q) return SLASH_ITEMS;
  return SLASH_ITEMS.filter((item) => item.label.toLowerCase().includes(q) || item.keywords.includes(q) || item.id.startsWith(q));
}

export interface SlashMatch {
  query: string;
  from: number;
  to: number;
}

/** Detects "/query" directly before the caret in a paragraph. */
export function findSlashMatch(editor: Editor): SlashMatch | null {
  const { selection } = editor.state;
  if (!selection.empty) return null;
  const { $from } = selection;
  if ($from.parent.type.name !== 'paragraph') return null;
  const before = $from.parent.textBetween(0, $from.parentOffset, undefined, '￼');
  const match = before.match(/(?:^|\s)\/([a-z0-9]{0,12})$/i);
  if (!match) return null;
  const query = match[1];
  return { query, from: $from.pos - query.length - 1, to: $from.pos };
}
