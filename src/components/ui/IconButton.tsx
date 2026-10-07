import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  /** Display string for the shortcut, e.g. "⌘B". */
  shortcut?: string;
  active?: boolean;
  /** Set for buttons that open a menu. */
  expanded?: boolean;
  children: ReactNode;
  variant?: 'tool' | 'ghost';
}

/** Icon-only button with an accessible name and a tooltip. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, shortcut, active, expanded, children, className = '', variant = 'tool', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      aria-pressed={expanded === undefined && active !== undefined ? active : undefined}
      aria-expanded={expanded}
      aria-haspopup={expanded !== undefined ? 'true' : undefined}
      aria-keyshortcuts={shortcut ? shortcut.replace('⌘', 'Meta+').replace('⇧', 'Shift+') : undefined}
      data-tip={label}
      data-kbd={shortcut}
      className={`${variant === 'tool' ? 'tb-btn' : 'ghost-btn'} ${active ? 'is-active' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});
