export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  /** Page background around everything. */
  background: string;
  /** Toolbars, popovers, menus. */
  surface: string;
  /** The writing sheet. */
  paper: string;
  /** Hairline around the writing sheet. */
  paperBorder: string;
  text: string;
  textMuted: string;
  textFaint: string;
  border: string;
  accent: string;
  /** Text drawn on top of `accent`. */
  accentContrast: string;
  accentSoft: string;
  highlight: string;
  selection: string;
  shadow: string;
  /** Ruled / grid / dot lines on the paper. */
  paperLine: string;
}

export interface Theme {
  id: string;
  name: string;
  /** One short line shown under the theme name. */
  description: string;
  scheme: ColorScheme;
  colors: ThemeColors;
  /** Three swatches for the picker. */
  preview: [string, string, string];
}
