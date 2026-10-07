export interface TextStats {
  words: number;
  characters: number;
  /** Minutes, rounded up; 0 for an empty document. */
  readingMinutes: number;
}

// Han, Hiragana, Katakana (incl. half-width). Korean uses spaces between
// words, so Hangul is counted by the regular word rule instead.
const CJK_CHAR = /[぀-ヿㇰ-ㇿ㐀-䶿一-鿿豈-﫿ｦ-ﾟ]/gu;
const WORD = /[\p{L}\p{N}][\p{L}\p{N}\p{M}'’_-]*/gu;

const WORDS_PER_MINUTE = 225;
const CJK_CHARS_PER_MINUTE = 500;

export function countGraphemes(text: string): number {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    let n = 0;
    for (const _ of new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)) n++;
    return n;
  }
  return Array.from(text).length;
}

export function getTextStats(text: string): TextStats {
  const cjkCount = text.match(CJK_CHAR)?.length ?? 0;
  const latin = cjkCount ? text.replace(CJK_CHAR, ' ') : text;
  const latinWords = latin.match(WORD)?.length ?? 0;

  const words = latinWords + cjkCount;
  const characters = countGraphemes(text.replace(/[\r\n]/g, ''));
  const minutes = latinWords / WORDS_PER_MINUTE + cjkCount / CJK_CHARS_PER_MINUTE;

  return {
    words,
    characters,
    readingMinutes: words === 0 ? 0 : Math.max(1, Math.ceil(minutes)),
  };
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}
