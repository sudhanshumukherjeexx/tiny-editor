export const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);

export const MOD = isMac ? '⌘' : 'Ctrl';
export const SHIFT = isMac ? '⇧' : 'Shift';

/** Formats a shortcut like `mod+shift+z` for display. */
export function shortcut(keys: string): string {
  return keys
    .split('+')
    .map((k) => {
      const key = k.toLowerCase();
      if (key === 'mod') return MOD;
      if (key === 'shift') return SHIFT;
      if (key === 'alt') return isMac ? '⌥' : 'Alt';
      return k.length === 1 ? k.toUpperCase() : k;
    })
    .join(isMac ? '' : '+');
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}
