/**
 * Ink (text) and highlighter colours are stored in the document as CSS
 * variables, so they adapt to light and dark themes on screen. Exports
 * resolve them to the printable light values below.
 */
export interface Swatch {
  id: string;
  name: string;
  /** Value stored in the document, e.g. `var(--ink-red)`. */
  value: string;
  /** Printable colour used for exports. */
  print: string;
}

export const INK_COLORS: Swatch[] = [
  { id: 'charcoal', name: 'Charcoal', value: 'var(--ink-charcoal)', print: '#2b2926' },
  { id: 'gray', name: 'Pencil gray', value: 'var(--ink-gray)', print: '#7a746c' },
  { id: 'red', name: 'Muted red', value: 'var(--ink-red)', print: '#a8434b' },
  { id: 'blue', name: 'Ink blue', value: 'var(--ink-blue)', print: '#2f4f7f' },
  { id: 'green', name: 'Pine green', value: 'var(--ink-green)', print: '#3d6844' },
  { id: 'purple', name: 'Plum', value: 'var(--ink-purple)', print: '#6b4f8a' },
];

export const HIGHLIGHT_COLORS: Swatch[] = [
  { id: 'butter', name: 'Butter', value: 'var(--hl-butter)', print: '#fbefb0' },
  { id: 'sakura', name: 'Sakura', value: 'var(--hl-sakura)', print: '#fadbe1' },
  { id: 'matcha', name: 'Matcha', value: 'var(--hl-matcha)', print: '#dcecc8' },
  { id: 'sky', name: 'Sky', value: 'var(--hl-sky)', print: '#d6e8f7' },
  { id: 'lavender', name: 'Lavender', value: 'var(--hl-lavender)', print: '#e6ddf6' },
  { id: 'peach', name: 'Peach', value: 'var(--hl-peach)', print: '#fde0cc' },
];

const PRINT_MAP = new Map<string, string>(
  [...INK_COLORS, ...HIGHLIGHT_COLORS].map((s) => [s.value, s.print]),
);

/**
 * Turns a stored colour into a safe, printable CSS colour, or null if the
 * value is not one we recognise (untrusted pasted styles are dropped).
 */
export function resolvePrintColor(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const mapped = PRINT_MAP.get(value.trim());
  if (mapped) return mapped;
  if (/^#[0-9a-f]{3,8}$/i.test(value.trim())) return value.trim();
  if (/^rgba?\(\s*[\d.\s,%]+\)$/i.test(value.trim())) return value.trim();
  return null;
}
