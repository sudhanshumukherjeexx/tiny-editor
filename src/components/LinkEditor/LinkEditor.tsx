import { useCallback, useState, type FormEvent } from 'react';
import type { Editor } from '@tiptap/react';
import { Link2Off } from 'lucide-react';
import { useUI } from '../../app/ui';
import { COPY } from '../../app/copy';
import { removeLink, selectionRect, setLink } from '../../editor/editorCommands';
import { normalizeUrl } from '../../utils/url';
import { Popover } from '../ui/Popover';

/** Compact URL popover anchored to the current selection. */
export function LinkEditor({ editor }: { editor: Editor }) {
  const { openPanel, closePanel } = useUI();
  const open = openPanel === 'link';
  const anchor = useCallback(() => (editor.isDestroyed ? null : selectionRect(editor)), [editor]);

  return (
    <Popover open={open} onClose={closePanel} anchor={anchor} label="Edit link" align="start" autoFocus={false} sheetOnMobile={false} className="w-link">
      {/* Remount per open so the field starts from the current link. */}
      {open && <LinkForm editor={editor} onDone={closePanel} />}
    </Popover>
  );
}

function LinkForm({ editor, onDone }: { editor: Editor; onDone: () => void }) {
  const existing = (editor.getAttributes('link').href as string | undefined) ?? '';
  const [value, setValue] = useState(existing);
  const [error, setError] = useState('');

  const apply = (event: FormEvent) => {
    event.preventDefault();
    if (!value.trim()) {
      if (existing) removeLink(editor);
      onDone();
      return;
    }
    const href = normalizeUrl(value);
    if (!href) {
      setError(COPY.invalidLink);
      return;
    }
    setLink(editor, href);
    onDone();
  };

  return (
    <form className="link-form" onSubmit={apply}>
      <label className="link-label" htmlFor="kaku-link-input">
        URL
      </label>
      <div className="link-row">
        <input
          id="kaku-link-input"
          className="field"
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://…"
          autoFocus
          value={value}
          aria-invalid={!!error}
          aria-describedby={error ? 'kaku-link-error' : undefined}
          onChange={(e) => {
            setValue(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              onDone();
              editor.commands.focus();
            }
          }}
        />
        <button type="submit" className="btn btn-accent">
          Apply
        </button>
      </div>
      {error && (
        <p id="kaku-link-error" className="field-error" role="alert">
          {error}
        </p>
      )}
      {existing && (
        <button
          type="button"
          className="link-remove"
          onClick={() => {
            removeLink(editor);
            onDone();
          }}
        >
          <Link2Off size={13} strokeWidth={2} aria-hidden="true" /> Remove link
        </button>
      )}
    </form>
  );
}
