import { useCallback, useMemo, useState } from 'react';
import { createTodo, getTodoStats, meaningfulTodos, moveItem, type TodoItem } from './todos';

/** In-memory to-do list. Like the note, it ends with the tab. */
export function useTodos() {
  const [items, setItems] = useState<TodoItem[]>([]);
  /** Text typed in the "add a task" field but not yet added. */
  const [draft, setDraft] = useState('');

  /** Adds a task after `afterId` (or at the end) and returns its id. */
  const add = useCallback((text = '', afterId?: string) => {
    const item = createTodo(text);
    setItems((list) => {
      const at = afterId ? list.findIndex((t) => t.id === afterId) : -1;
      if (at < 0) return [...list, item];
      return [...list.slice(0, at + 1), item, ...list.slice(at + 1)];
    });
    return item.id;
  }, []);

  const update = useCallback((id: string, patch: Partial<Omit<TodoItem, 'id'>>) => {
    setItems((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const toggle = useCallback((id: string) => {
    setItems((list) => list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const remove = useCallback((id: string) => setItems((list) => list.filter((t) => t.id !== id)), []);

  const move = useCallback((id: string, delta: number) => {
    setItems((list) => moveItem(list, list.findIndex((t) => t.id === id), delta));
  }, []);

  const clearDone = useCallback(() => setItems((list) => list.filter((t) => !t.done)), []);

  const stats = useMemo(() => getTodoStats(items), [items]);

  /** What exports see: the list plus a task still being typed. */
  const exportItems = useMemo(() => meaningfulTodos(draft.trim() ? [...items, { id: 'draft', text: draft, done: false }] : items), [items, draft]);

  return { items, stats, draft, setDraft, exportItems, add, update, toggle, remove, move, clearDone };
}

export type Todos = ReturnType<typeof useTodos>;
