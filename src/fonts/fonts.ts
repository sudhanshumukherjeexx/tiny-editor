/**
 * A deliberately small, curated font library. Fonts are self-hosted via
 * Fontsource (no third-party requests) and their stylesheets are only
 * imported when a font is first chosen.
 */
export interface DocumentFont {
  id: string;
  /** Name shown in the picker, rendered in the font itself. */
  label: string;
  category: string;
  family: string;
  load: () => Promise<unknown>;
}

export const FONTS: DocumentFont[] = [
  {
    id: 'typewriter',
    label: 'Special Elite',
    category: 'typewriter',
    family: "'Special Elite', 'Courier New', ui-monospace, monospace",
    // Loaded eagerly in main.tsx because it is the default.
    load: () => Promise.resolve(),
  },
  {
    id: 'inter',
    label: 'Inter',
    category: 'clean',
    family: "'Inter', system-ui, sans-serif",
    // The UI already ships Inter 400/500/600; add italics + bold for writing.
    load: () => Promise.all([import('@fontsource/inter/400-italic.css'), import('@fontsource/inter/700.css')]),
  },
  {
    id: 'cormorant',
    label: 'Cormorant',
    category: 'editorial',
    family: "'Cormorant Garamond', 'Iowan Old Style', Georgia, serif",
    load: () =>
      Promise.all([
        import('@fontsource/cormorant-garamond/500.css'),
        import('@fontsource/cormorant-garamond/400-italic.css'),
        import('@fontsource/cormorant-garamond/700.css'),
      ]),
  },
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    category: 'geometric',
    family: "'Space Grotesk', system-ui, sans-serif",
    load: () => Promise.all([import('@fontsource/space-grotesk/400.css'), import('@fontsource/space-grotesk/700.css')]),
  },
  {
    id: 'jetbrains-mono',
    label: 'JetBrains Mono',
    category: 'technical',
    family: "'JetBrains Mono', ui-monospace, monospace",
    load: () =>
      Promise.all([
        import('@fontsource/jetbrains-mono/400.css'),
        import('@fontsource/jetbrains-mono/400-italic.css'),
        import('@fontsource/jetbrains-mono/700.css'),
      ]),
  },
  {
    id: 'noto-sans-jp',
    label: 'Noto Sans JP',
    category: '日本語',
    family: "'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif",
    load: () => Promise.all([import('@fontsource/noto-sans-jp/400.css'), import('@fontsource/noto-sans-jp/700.css')]),
  },
  {
    id: 'noto-sans-kr',
    label: 'Noto Sans KR',
    category: '한국어',
    family: "'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
    load: () => Promise.all([import('@fontsource/noto-sans-kr/400.css'), import('@fontsource/noto-sans-kr/700.css')]),
  },
  {
    id: 'nunito-sans',
    label: 'Nunito Sans',
    category: 'friendly',
    family: "'Nunito Sans', system-ui, sans-serif",
    load: () =>
      Promise.all([
        import('@fontsource/nunito-sans/400.css'),
        import('@fontsource/nunito-sans/400-italic.css'),
        import('@fontsource/nunito-sans/700.css'),
      ]),
  },
  {
    id: 'console',
    label: 'Future Console',
    category: 'hud',
    family: "'Oxanium', 'Space Grotesk', system-ui, sans-serif",
    load: () => Promise.all([import('@fontsource/oxanium/400.css'), import('@fontsource/oxanium/700.css')]),
  },
];

export const DEFAULT_FONT_ID = 'typewriter';

export function getFont(id: string): DocumentFont {
  return FONTS.find((f) => f.id === id) ?? FONTS[0];
}

const loaded = new Map<string, Promise<unknown>>();

/** Loads a font's stylesheet once; failures fall back to system fonts silently. */
export function ensureFontLoaded(id: string): Promise<unknown> {
  let p = loaded.get(id);
  if (!p) {
    p = getFont(id)
      .load()
      .catch(() => undefined);
    loaded.set(id, p);
  }
  return p;
}
