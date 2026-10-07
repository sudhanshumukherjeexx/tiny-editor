import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';

export interface Command {
  id: string;
  label: string;
  group: string;
  hint?: string;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: Command[];
}

/** A tiny command palette (Cmd/Ctrl+K with no selection, or Cmd/Ctrl+Shift+P). */
export function CommandPalette({ open, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      restoreFocus.current = document.activeElement as HTMLElement | null;
      setQuery('');
      setIndex(0);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.group} ${c.label}`.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  if (!open) return null;

  const close = () => {
    onClose();
    restoreFocus.current?.focus?.();
  };

  const run = (cmd: Command | undefined) => {
    if (!cmd) return;
    onClose();
    // Let the palette unmount before running (some commands open panels).
    requestAnimationFrame(cmd.run);
  };

  return createPortal(
    <div className="palette-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="palette-input-row">
          <Search size={15} strokeWidth={1.75} aria-hidden="true" />
          <input
            className="palette-input"
            autoFocus
            placeholder="Type a command…"
            value={query}
            role="combobox"
            aria-expanded="true"
            aria-controls="kaku-palette-list"
            aria-activedescendant={results[index] ? `cmd-${results[index].id}` : undefined}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setIndex((i) => Math.min(results.length - 1, i + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setIndex((i) => Math.max(0, i - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                run(results[index]);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                close();
              }
            }}
          />
          <kbd className="menu-kbd">esc</kbd>
        </div>
        <div id="kaku-palette-list" ref={listRef} className="palette-list" role="listbox">
          {results.length === 0 && <p className="slash-empty">no commands match ✿</p>}
          {results.map((cmd, i) => (
            <div
              key={cmd.id}
              id={`cmd-${cmd.id}`}
              role="option"
              aria-selected={i === index}
              className={`palette-item ${i === index ? 'is-active' : ''}`}
              onMouseEnter={() => setIndex(i)}
              onClick={() => run(cmd)}
            >
              <span className="palette-group">{cmd.group}</span>
              <span className="palette-label">{cmd.label}</span>
              {cmd.hint && <kbd className="menu-kbd">{cmd.hint}</kbd>}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
