import { useEffect } from 'react';
import { Check } from 'lucide-react';
import { FONTS, ensureFontLoaded } from '../../fonts/fonts';
import { useSettings } from '../../app/settings';

/** The curated font list; each name is rendered in its own face. */
export function FontList({ onPick }: { onPick?: () => void }) {
  const { settings, update } = useSettings();

  // Load faces so the preview names render correctly (Latin subsets are tiny).
  useEffect(() => {
    FONTS.forEach((f) => void ensureFontLoaded(f.id));
  }, []);

  return (
    <ul className="font-list" role="listbox" aria-label="Document font">
      {FONTS.map((font) => {
        const selected = settings.fontId === font.id;
        return (
          <li key={font.id}>
            <button
              type="button"
              role="option"
              aria-selected={selected}
              className={`font-option ${selected ? 'is-selected' : ''}`}
              onClick={() => {
                void ensureFontLoaded(font.id);
                update({ fontId: font.id });
                onPick?.();
              }}
            >
              <span className="font-name" style={{ fontFamily: font.family }}>
                {font.label}
              </span>
              <span className="font-cat">{font.category}</span>
              <span className="font-check" aria-hidden="true">
                {selected && <Check size={14} strokeWidth={2} />}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
