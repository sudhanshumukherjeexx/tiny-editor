import { describe, expect, it } from 'vitest';
import { fileNameWithExtension, sanitizeFileName } from './fileName';
import { getTextStats } from './textStats';
import { normalizeUrl } from './url';

describe('sanitizeFileName', () => {
  it('keeps normal titles', () => {
    expect(sanitizeFileName('Sunday Thoughts')).toBe('Sunday Thoughts');
    expect(fileNameWithExtension('Untitled', 'md')).toBe('Untitled.md');
  });

  it('removes illegal characters and trims dots', () => {
    expect(sanitizeFileName('a/b\\c:d*e?f"g<h>i|j')).toBe('a b c d e f g h i j');
    expect(sanitizeFileName('...hidden.')).toBe('hidden');
    expect(sanitizeFileName('tab\tand\nnewline')).toBe('tabandnewline');
  });

  it('falls back for empty or reserved names', () => {
    expect(sanitizeFileName('   ')).toBe('Untitled');
    expect(sanitizeFileName('???')).toBe('Untitled');
    expect(sanitizeFileName('CON')).toBe('CON_');
  });

  it('keeps Japanese and Korean titles and limits length', () => {
    expect(sanitizeFileName('日記 / 일기')).toBe('日記 일기');
    expect(Array.from(sanitizeFileName('あ'.repeat(200))).length).toBe(80);
  });
});

describe('getTextStats', () => {
  it('counts English words', () => {
    expect(getTextStats('').words).toBe(0);
    expect(getTextStats('Hello, world!  It’s a fine-tuned day.').words).toBe(6);
  });

  it('counts characters without line breaks', () => {
    expect(getTextStats('ab\ncd').characters).toBe(4);
    expect(getTextStats('👩‍💻!').characters).toBe(2);
  });

  it('counts Japanese characters individually and Korean by spaces', () => {
    expect(getTextStats('今日は晴れ').words).toBe(5);
    expect(getTextStats('안녕하세요 반갑습니다').words).toBe(2);
    expect(getTextStats('Kaku は 書く').words).toBe(4);
  });

  it('estimates reading time', () => {
    expect(getTextStats('').readingMinutes).toBe(0);
    expect(getTextStats('word').readingMinutes).toBe(1);
    expect(getTextStats(Array(451).fill('word').join(' ')).readingMinutes).toBe(3);
  });
});

describe('normalizeUrl', () => {
  it('adds https and accepts emails', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com/');
    expect(normalizeUrl('me@example.com')).toBe('mailto:me@example.com');
  });

  it('rejects unsafe or invalid input', () => {
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeUrl('data:text/html,hi')).toBeNull();
    expect(normalizeUrl('not a url')).toBeNull();
    expect(normalizeUrl('hello')).toBeNull();
  });
});
