import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_FONT_ID } from '../fonts/fonts';
import { DEFAULT_THEME_ID } from '../themes/themes';
import type { PaperStyle } from '../export/printDocument';
import type { DateStyle } from '../utils/date';

/**
 * Appearance and writing preferences. Intentionally kept in memory only:
 * like the document itself, they reset when the tab closes.
 */
export interface Settings {
  themeId: string;
  fontId: string;
  paper: PaperStyle;
  paperTexture: boolean;
  width: 'narrow' | 'normal' | 'wide';
  lineHeight: 'snug' | 'cozy' | 'airy';
  textSize: 'small' | 'medium' | 'large';
  dateStyle: DateStyle;
  caret: 'classic' | 'typewriter' | 'glow';
  petals: boolean;
  sparkles: boolean;
  sound: boolean;
  reduceEffects: boolean;
  typewriterMode: boolean;
  focusParagraph: boolean;
  focusMode: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  themeId: DEFAULT_THEME_ID,
  fontId: DEFAULT_FONT_ID,
  paper: 'plain',
  paperTexture: false,
  width: 'normal',
  lineHeight: 'cozy',
  textSize: 'medium',
  dateStyle: 'english',
  caret: 'classic',
  petals: false,
  sparkles: false,
  sound: false,
  reduceEffects: false,
  typewriterMode: false,
  focusParagraph: false,
  focusMode: false,
};

interface SettingsContextValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  toggle: (key: BooleanKeys<Settings>) => void;
}

type BooleanKeys<T> = { [K in keyof T]: T[K] extends boolean ? K : never }[keyof T];

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const update = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);
  const toggle = useCallback((key: BooleanKeys<Settings>) => setSettings((s) => ({ ...s, [key]: !s[key] })), []);
  const value = useMemo(() => ({ settings, update, toggle }), [settings, update, toggle]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
