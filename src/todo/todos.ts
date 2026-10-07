import type { DocNode } from '../export/types';

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

export interface TodoStats {
  total: number;
  done: number;
}

let nextId = 1;
export const createTodo = (text = ''): TodoItem => ({ id: `t${nextId++}`, text, done: false });

/** Tasks with only whitespace are drafts and don't count or export. */
export const meaningfulTodos = (items: TodoItem[]): TodoItem[] => items.filter((t) => t.text.trim());

export function getTodoStats(items: TodoItem[]): TodoStats {
  const real = meaningfulTodos(items);
  return { total: real.length, done: real.filter((t) => t.done).length };
}

/**
 * Expresses a to-do list as a Tiptap checklist document, so every existing
 * exporter (Markdown, text, HTML, print) handles it without special cases.
 */
export function todosToDoc(items: TodoItem[]): DocNode {
  const real = meaningfulTodos(items);
  if (!real.length) return { type: 'doc', content: [{ type: 'paragraph' }] };
  return {
    type: 'doc',
    content: [
      {
        type: 'taskList',
        content: real.map((t) => ({
          type: 'taskItem',
          attrs: { checked: t.done },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: t.text.trim() }] }],
        })),
      },
    ],
  };
}

/** Moves the item at `from` by `delta` places, clamped to the list. */
export function moveItem<T>(items: T[], from: number, delta: number): T[] {
  const to = Math.max(0, Math.min(items.length - 1, from + delta));
  if (to === from || from < 0 || from >= items.length) return items;
  const next = items.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
