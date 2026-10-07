import { useEffect, useImperativeHandle, useRef, type KeyboardEvent, type Ref } from 'react';
import { Plus, X } from 'lucide-react';
import { COPY } from '../../app/copy';
import type { Settings } from '../../app/settings';
import { paperLook, useAutoHeight } from '../../editor/Paper';
import type { TodoItem } from '../../todo/todos';
import type { Todos } from '../../todo/useTodos';

export interface TodoSheetHandle {
  /** Inserts text (a kaomoji, a symbol) at the caret of the last-used field. */
  insert: (text: string) => void;
  focus: () => void;
}

interface TodoSheetProps {
  todos: Todos;
  settings: Settings;
  title: string;
  onTitleChange: (title: string) => void;
  dateLabel: string;
  /** False while the note is shown. */
  active: boolean;
  ref?: Ref<TodoSheetHandle>;
}

const NEW = 'new';

/** A to-do list on the same paper as notes. In memory only. */
export function TodoSheet({ todos, settings, title, onTitleChange, dateLabel, active, ref }: TodoSheetProps) {
  const { items, stats, draft, setDraft } = todos;
  const fields = useRef(new Map<string, HTMLTextAreaElement>());
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const pendingFocus = useRef<{ id: string; at: 'start' | 'end' } | null>(null);
  const lastField = useRef<string>(NEW);
  const layoutDeps = [settings.fontId, settings.textSize, settings.width, active];
  useAutoHeight(titleRef, [title, ...layoutDeps]);

  const focusField = (id: string, at: 'start' | 'end' = 'end') => {
    const el = fields.current.get(id);
    if (!el) {
      pendingFocus.current = { id, at };
      return;
    }
    el.focus();
    const pos = at === 'start' ? 0 : el.value.length;
    el.setSelectionRange(pos, pos);
  };

  // Fields for newly added tasks only exist after the next render.
  useEffect(() => {
    const p = pendingFocus.current;
    if (p && fields.current.has(p.id)) {
      pendingFocus.current = null;
      focusField(p.id, p.at);
    }
  });

  useImperativeHandle(ref, () => ({
    focus: () => focusField(NEW),
    insert: (text: string) => {
      const id = fields.current.has(lastField.current) ? lastField.current : NEW;
      const el = fields.current.get(id);
      if (!el) return;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? start;
      const value = el.value.slice(0, start) + text + el.value.slice(end);
      if (id === NEW) setDraft(value);
      else todos.update(id, { text: value });
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + text.length, start + text.length);
      });
    },
  }));

  const neighbour = (index: number, delta: number) => items[index + delta]?.id ?? (delta > 0 ? NEW : undefined);

  const onRowKey = (event: KeyboardEvent<HTMLTextAreaElement>, item: TodoItem, index: number) => {
    if (event.nativeEvent.isComposing) return; // let Japanese/Korean IME finish
    const el = event.currentTarget;
    const atStart = el.selectionStart === 0 && el.selectionEnd === 0;
    const atEnd = el.selectionStart === el.value.length;
    const mod = event.metaKey || event.ctrlKey;

    if (event.key === 'Enter' && mod) {
      event.preventDefault();
      todos.toggle(item.id);
    } else if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      focusField(todos.add('', item.id));
    } else if (event.key === 'Backspace' && !el.value) {
      event.preventDefault();
      todos.remove(item.id);
      const prev = neighbour(index, -1) ?? neighbour(index, 1);
      if (prev) focusField(prev);
    } else if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      todos.move(item.id, event.key === 'ArrowUp' ? -1 : 1);
      requestAnimationFrame(() => el.focus());
    } else if (event.key === 'ArrowUp' && atStart) {
      const prev = neighbour(index, -1);
      if (prev) {
        event.preventDefault();
        focusField(prev);
      }
    } else if (event.key === 'ArrowDown' && atEnd) {
      event.preventDefault();
      focusField(neighbour(index, 1)!, 'start');
    }
  };

  const onNewKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (draft.trim()) {
        todos.add(draft.trim());
        setDraft('');
      }
    } else if ((event.key === 'Backspace' && !draft) || (event.key === 'ArrowUp' && event.currentTarget.selectionStart === 0)) {
      const last = items.at(-1);
      if (last) {
        event.preventDefault();
        focusField(last.id);
      }
    }
  };

  const register = (id: string) => (el: HTMLTextAreaElement | null) => {
    if (el) fields.current.set(id, el);
    else fields.current.delete(id);
  };

  const { className, style } = paperLook(settings, ['todo-sheet']);
  const allDone = stats.total > 0 && stats.done === stats.total;
  const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <article className={className} style={style} aria-label="To-do list">
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
          aria-label="List title"
          placeholder="To-do"
          onChange={(e) => onTitleChange(e.target.value.replace(/\n/g, ' '))}
          onFocus={(e) => {
            if (e.target.value === COPY.todoTitle) e.target.select();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || (e.key === 'ArrowDown' && !e.shiftKey)) {
              e.preventDefault();
              focusField(items[0]?.id ?? NEW, 'start');
            }
          }}
        />
        <p className={`empty-ja ${items.length ? 'is-hidden' : ''}`} aria-hidden="true">
          {COPY.todoPlaceholderJa}
        </p>
        {stats.total > 0 && (
          <div className="todo-progress">
            <span className="todo-meter" aria-hidden="true">
              <span style={{ width: `${pct}%` }} />
            </span>
            <span className={`todo-count ${allDone ? 'is-all-done' : ''}`} role="status">
              {allDone ? `all ${stats.total} done ✿` : `${stats.done} of ${stats.total} done`}
            </span>
            {stats.done > 0 && (
              <button type="button" className="todo-clear" onClick={todos.clearDone}>
                clear done
              </button>
            )}
          </div>
        )}
      </header>

      <ul className="todo-list">
        {items.map((item, index) => (
          <li key={item.id} className={`todo-item ${item.done ? 'is-done' : ''}`}>
            <button
              type="button"
              role="checkbox"
              aria-checked={item.done}
              aria-label={item.text.trim() ? `Done: ${item.text}` : 'Done'}
              className="todo-check"
              onClick={() => todos.toggle(item.id)}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4 8.4 6.8 11 12 5.2" />
              </svg>
            </button>
            <AutoTextarea
              fieldRef={register(item.id)}
              className="todo-text"
              value={item.text}
              ariaLabel={`Task ${index + 1}`}
              onChange={(text) => todos.update(item.id, { text })}
              onKeyDown={(e) => onRowKey(e, item, index)}
              onFocus={() => (lastField.current = item.id)}
              deps={layoutDeps}
            />
            <button type="button" className="todo-remove" aria-label={`Delete task ${index + 1}`} data-tip="Delete" onClick={() => todos.remove(item.id)}>
              <X size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          </li>
        ))}
        <li className="todo-item todo-new">
          <span className="todo-plus" aria-hidden="true">
            <Plus size={14} strokeWidth={2.25} />
          </span>
          <AutoTextarea
            fieldRef={register(NEW)}
            className="todo-text"
            value={draft}
            ariaLabel="Add a task"
            placeholder={items.length ? COPY.todoAddMore : COPY.todoPlaceholder}
            onChange={setDraft}
            onKeyDown={onNewKey}
            onFocus={() => (lastField.current = NEW)}
            deps={layoutDeps}
          />
        </li>
      </ul>
      <p className="todo-hint" aria-hidden="true">
        <kbd>Enter</kbd> new task · <kbd>Ctrl/⌘ Enter</kbd> tick · <kbd>Alt ↑↓</kbd> reorder
      </p>
    </article>
  );
}

interface AutoTextareaProps {
  fieldRef: (el: HTMLTextAreaElement | null) => void;
  className: string;
  value: string;
  ariaLabel: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onFocus?: () => void;
  deps: unknown[];
}

function AutoTextarea({ fieldRef, className, value, ariaLabel, placeholder, onChange, onKeyDown, onFocus, deps }: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useAutoHeight(ref, [value, ...deps]);
  return (
    <textarea
      ref={(el) => {
        ref.current = el;
        fieldRef(el);
      }}
      className={className}
      rows={1}
      value={value}
      maxLength={500}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value.replace(/\n/g, ' '))}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
    />
  );
}
