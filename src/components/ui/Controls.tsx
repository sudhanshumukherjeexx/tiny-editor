import { useId, type ReactNode } from 'react';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

/** A labelled switch row. */
export function Toggle({ label, checked, onChange, hint, icon, disabled }: ToggleProps) {
  const id = useId();
  return (
    <label className={`toggle-row ${disabled ? 'is-disabled' : ''}`} htmlFor={id}>
      {icon && <span className="toggle-icon" aria-hidden="true">{icon}</span>}
      <span className="toggle-text">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (value: T) => void;
}

/** A compact single-choice control (radio group). */
export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  const name = useId();
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((opt) => (
        <label key={opt.value} className={`segmented-opt ${opt.value === value ? 'is-selected' : ''}`} title={opt.title}>
          <input type="radio" name={name} value={opt.value} checked={opt.value === value} onChange={() => onChange(opt.value)} />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

export function PanelSection({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="panel-section">
      <h3 className="panel-label">
        <span>{title}</span>
        {aside}
      </h3>
      {children}
    </section>
  );
}
