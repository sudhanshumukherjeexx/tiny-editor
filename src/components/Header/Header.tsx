import { useRef, type ReactNode } from 'react';
import { ListChecks, Maximize2, Minimize2, NotebookPen, Palette, Settings2 } from 'lucide-react';
import { useUI } from '../../app/ui';
import { useSettings } from '../../app/settings';
import { BRAND } from '../../config/brand';
import { shortcut } from '../../utils/platform';
import { Popover } from '../ui/Popover';
import { ThemePicker } from '../ThemePicker/ThemePicker';
import { SettingsPanel } from '../SettingsPanel/SettingsPanel';

export type SheetMode = 'note' | 'todo';

interface HeaderProps {
  mode: SheetMode;
  onModeChange: (mode: SheetMode) => void;
  title: string;
  onTitleChange: (title: string) => void;
  onLogoClick: () => void;
  mood: ReactNode;
  exportMenu: ReactNode;
}

const MODES = [
  { value: 'note', label: 'Note', Icon: NotebookPen },
  { value: 'todo', label: 'To-do', Icon: ListChecks },
] as const;

export function Header({ mode, onModeChange, title, onTitleChange, onLogoClick, mood, exportMenu }: HeaderProps) {
  const { openPanel, togglePanel, closePanel } = useUI();
  const { settings, toggle } = useSettings();
  const moodRef = useRef<HTMLButtonElement>(null);
  const themeRef = useRef<HTMLButtonElement>(null);
  const settingsRef = useRef<HTMLButtonElement>(null);

  return (
    <header className="app-header">
      <div className="header-left">
        <button type="button" className="logo" onClick={onLogoClick} aria-label={`${BRAND.name} — ${BRAND.tagline}`}>
          <span className="logo-mark" aria-hidden="true">
            {BRAND.mark}
          </span>
          <span className="logo-word">{BRAND.wordmark}</span>
          <span className="logo-kana" aria-hidden="true">
            {BRAND.wordmarkKana}
          </span>
        </button>
        <span className="header-slash" aria-hidden="true">
          /
        </span>
        <input
          className="header-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          aria-label={mode === 'note' ? 'Document title' : 'List title'}
          spellCheck={false}
          maxLength={120}
          size={Math.max(8, Math.min(28, title.length + 1))}
        />
      </div>

      <nav className="header-actions" aria-label="Document">
        <div className="mode-switch" role="radiogroup" aria-label="Sheet type">
          {MODES.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mode === value}
              aria-label={label}
              data-tip={value === 'note' ? 'Write a note' : 'Make a to-do list'}
              className={`mode-opt ${mode === value ? 'is-selected' : ''}`}
              onClick={() => onModeChange(value)}
            >
              <Icon size={14} strokeWidth={1.85} aria-hidden="true" />
              <span className="mode-label">{label}</span>
            </button>
          ))}
        </div>
        <button
          ref={moodRef}
          type="button"
          className={`hdr-btn ${openPanel === 'mood' ? 'is-open' : ''}`}
          aria-haspopup="true"
          aria-expanded={openPanel === 'mood'}
          aria-label="Mood"
          data-tip="Mood · paper, atmosphere, goals"
          onClick={() => togglePanel('mood')}
        >
          <span className="mood-glyph" aria-hidden="true">
            ✿
          </span>
          <span className="hdr-label">Mood</span>
        </button>
        <button
          ref={themeRef}
          type="button"
          className={`hdr-btn ${openPanel === 'theme' ? 'is-open' : ''}`}
          aria-haspopup="true"
          aria-expanded={openPanel === 'theme'}
          aria-label="Theme"
          data-tip="Theme"
          onClick={() => togglePanel('theme')}
        >
          <Palette size={15} strokeWidth={1.75} aria-hidden="true" />
          <span className="hdr-label">Theme</span>
        </button>
        <button
          ref={settingsRef}
          type="button"
          className={`hdr-btn icon-only ${openPanel === 'settings' ? 'is-open' : ''}`}
          aria-haspopup="true"
          aria-expanded={openPanel === 'settings'}
          aria-label="Preferences"
          data-tip="Preferences"
          onClick={() => togglePanel('settings')}
        >
          <Settings2 size={15} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`hdr-btn ${settings.focusMode ? 'is-open' : ''}`}
          aria-pressed={settings.focusMode}
          aria-label="Focus mode"
          data-tip="Focus mode"
          data-kbd={shortcut('mod+shift+f')}
          onClick={() => toggle('focusMode')}
        >
          {settings.focusMode ? <Minimize2 size={15} strokeWidth={1.75} aria-hidden="true" /> : <Maximize2 size={15} strokeWidth={1.75} aria-hidden="true" />}
          <span className="hdr-label">Focus</span>
        </button>
        {exportMenu}
      </nav>

      <Popover open={openPanel === 'mood'} onClose={closePanel} anchor={moodRef} label="Mood" align="end" className="w-mood spring">
        {mood}
      </Popover>
      <Popover open={openPanel === 'theme'} onClose={closePanel} anchor={themeRef} label="Theme" align="end" className="w-theme">
        <ThemePicker />
      </Popover>
      <Popover open={openPanel === 'settings'} onClose={closePanel} anchor={settingsRef} label="Preferences" align="end" className="w-settings">
        <SettingsPanel />
      </Popover>
    </header>
  );
}
