import { useState, type FormEvent } from 'react';
import type { Editor } from '@tiptap/react';
import { KaomojiPicker } from '../KaomojiPicker/KaomojiPicker';
import { useSettings, type Settings } from '../../app/settings';
import type { WritingTimer } from '../../hooks/useWritingTimer';
import { PanelSection, Segmented, Toggle } from '../ui/Controls';

const PAPERS: { value: Settings['paper']; label: string }[] = [
  { value: 'plain', label: 'Plain' },
  { value: 'ruled', label: 'Ruled' },
  { value: 'grid', label: 'Grid' },
  { value: 'dots', label: 'Dots' },
  { value: 'letter', label: 'Letter' },
];

interface MoodPanelProps {
  goal: number | null;
  onGoalChange: (goal: number | null) => void;
  timer: WritingTimer;
  editor: Editor;
}

/** ✿ Mood — optional atmosphere, paper and writing aids. */
export function MoodPanel({ goal, onGoalChange, timer, editor }: MoodPanelProps) {
  const { settings, update } = useSettings();
  const [goalDraft, setGoalDraft] = useState(goal ? String(goal) : '');
  const [customMinutes, setCustomMinutes] = useState('');
  const effectsOff = settings.reduceEffects;

  const submitGoal = (event: FormEvent) => {
    event.preventDefault();
    const n = Math.round(Number(goalDraft));
    onGoalChange(Number.isFinite(n) && n > 0 ? Math.min(n, 100_000) : null);
  };

  const startCustom = (event: FormEvent) => {
    event.preventDefault();
    const n = Number(customMinutes);
    if (Number.isFinite(n) && n > 0) timer.start(n);
  };

  return (
    <div className="panel-body mood">
      <PanelSection title="Paper">
        <div className="paper-picker" role="radiogroup" aria-label="Paper style">
          {PAPERS.map((p) => (
            <button
              key={p.value}
              type="button"
              role="radio"
              aria-checked={settings.paper === p.value}
              className={`paper-chip ${settings.paper === p.value ? 'is-selected' : ''}`}
              onClick={() => update({ paper: p.value })}
            >
              <span className={`paper-thumb paper-${p.value}`} aria-hidden="true" />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Atmosphere">
        <Toggle label="Sakura petals" icon="❀" checked={settings.petals} disabled={effectsOff} onChange={(petals) => update({ petals })} />
        <Toggle label="Soft sparkles" icon="✧" checked={settings.sparkles} disabled={effectsOff} onChange={(sparkles) => update({ sparkles })} />
        <Toggle label="Paper grain" icon="░" checked={settings.paperTexture} onChange={(paperTexture) => update({ paperTexture })} />
        <Toggle label="Typewriter sound" icon="♪" hint="soft clicks while typing" checked={settings.sound} onChange={(sound) => update({ sound })} />
      </PanelSection>

      <PanelSection title="Caret">
        <Segmented
          label="Caret style"
          value={settings.caret}
          onChange={(caret) => update({ caret })}
          options={[
            { value: 'classic', label: 'Classic' },
            { value: 'typewriter', label: 'Ribbon' },
            { value: 'glow', label: 'Soft glow' },
          ]}
        />
      </PanelSection>

      <PanelSection title="Writing">
        <Toggle
          label="Typewriter mode"
          icon="⌨"
          hint="keeps your line centred"
          checked={settings.typewriterMode}
          onChange={(typewriterMode) => update({ typewriterMode })}
        />
        <Toggle
          label="Focus current paragraph"
          icon="◎"
          hint="softly dims the rest"
          checked={settings.focusParagraph}
          onChange={(focusParagraph) => update({ focusParagraph })}
        />

        <form className="inline-form" onSubmit={submitGoal}>
          <label htmlFor="kaku-goal" className="inline-label">
            <span aria-hidden="true">✎</span> Word goal
          </label>
          <input
            id="kaku-goal"
            className="field field-sm"
            type="number"
            min={1}
            max={100000}
            inputMode="numeric"
            placeholder="500"
            value={goalDraft}
            onChange={(e) => setGoalDraft(e.target.value)}
          />
          <button type="submit" className="btn btn-sm">
            Set
          </button>
          {goal && (
            <button
              type="button"
              className="btn btn-sm btn-quiet"
              onClick={() => {
                setGoalDraft('');
                onGoalChange(null);
              }}
            >
              Clear
            </button>
          )}
        </form>

        <div className="inline-form">
          <span className="inline-label">
            <span aria-hidden="true">◷</span> Timer
          </span>
          <div className="chip-row tight" role="group" aria-label="Start a writing timer">
            {[15, 25, 45].map((m) => (
              <button key={m} type="button" className="chip" onClick={() => timer.start(m)}>
                {m}m
              </button>
            ))}
          </div>
        </div>
        <form className="inline-form" onSubmit={startCustom}>
          <span className="inline-label" aria-hidden="true" />
          <label htmlFor="kaku-custom-timer" className="sr-only">
            Custom minutes
          </label>
          <input
            id="kaku-custom-timer"
            className="field field-sm"
            type="number"
            min={1}
            max={240}
            inputMode="numeric"
            placeholder="custom"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
          />
          <button type="submit" className="btn btn-sm">
            Start
          </button>
          {timer.status !== 'off' && (
            <button type="button" className="btn btn-sm btn-quiet" onClick={timer.stop}>
              Stop
            </button>
          )}
        </form>
      </PanelSection>

      <PanelSection title="Insert">
        <details className="mood-insert">
          <summary>
            <span>♡ Kaomoji</span>
            <span>✦ Symbols</span>
          </summary>
          <KaomojiPicker editor={editor} />
        </details>
      </PanelSection>
    </div>
  );
}
