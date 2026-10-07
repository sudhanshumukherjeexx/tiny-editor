import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import { insertText } from '../../editor/editorCommands';
import { KAOMOJI, SYMBOLS } from './stamps';

type Tab = 'kaomoji' | 'symbols';

/** A small stationery drawer of kaomoji and symbols; inserts plain text. */
export function KaomojiPicker({ editor, initialTab = 'kaomoji' }: { editor: Editor; initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [category, setCategory] = useState('Happy');
  const [flash, setFlash] = useState<string | null>(null);

  const insert = (text: string) => {
    insertText(editor, text);
    setFlash(text);
    window.setTimeout(() => setFlash((f) => (f === text ? null : f)), 700);
  };

  return (
    <div className="stamps">
      <div className="stamp-tabs" role="tablist" aria-label="Insert">
        <button type="button" role="tab" aria-selected={tab === 'kaomoji'} className="stamp-tab" onClick={() => setTab('kaomoji')}>
          (˶ᵔ ᵕ ᵔ˶) kaomoji
        </button>
        <button type="button" role="tab" aria-selected={tab === 'symbols'} className="stamp-tab" onClick={() => setTab('symbols')}>
          ✦ symbols
        </button>
      </div>

      {tab === 'kaomoji' ? (
        <div role="tabpanel" aria-label="Kaomoji">
          <div className="chip-row" role="group" aria-label="Mood">
            {Object.keys(KAOMOJI).map((c) => (
              <button key={c} type="button" className={`chip ${c === category ? 'is-selected' : ''}`} aria-pressed={c === category} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="kaomoji-grid">
            {KAOMOJI[category].map((k) => (
              <button key={k} type="button" className={`kaomoji ${flash === k ? 'is-flash' : ''}`} onClick={() => insert(k)} aria-label={`Insert ${k}`}>
                {k}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div role="tabpanel" aria-label="Symbols" className="symbol-grid">
          {SYMBOLS.map((s) => (
            <button key={s} type="button" className={`symbol ${flash === s ? 'is-flash' : ''}`} onClick={() => insert(s)} aria-label={`Insert ${s}`}>
              {s}
            </button>
          ))}
        </div>
      )}
      <p className="stamps-foot" aria-live="polite">
        {flash ? `inserted ${flash}` : 'click to insert at the cursor'}
      </p>
    </div>
  );
}
