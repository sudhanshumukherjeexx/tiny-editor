import { describe, expect, it } from 'vitest';
import { getTodoStats, moveItem, todosToDoc, type TodoItem } from './todos';
import { toMarkdown } from '../export/toMarkdown';
import { toPlainText } from '../export/toPlainText';
import { wrapText } from '../export/toCard';

const item = (text: string, done = false, id = text): TodoItem => ({ id, text, done });

describe('to-do lists', () => {
  it('exports as a Markdown checklist, skipping blank drafts', () => {
    const doc = todosToDoc([item('Buy milk', true), item('   '), item('Call Hana')]);
    expect(toMarkdown(doc, 'Errands')).toBe('# Errands\n\n- [x] Buy milk\n- [ ] Call Hana\n');
  });

  it('exports as plain text', () => {
    expect(toPlainText(todosToDoc([item('Buy milk', true), item('Call Hana')]))).toContain('Call Hana');
  });

  it('is an empty document when there are no real tasks', () => {
    expect(toMarkdown(todosToDoc([item(''), item('  ')]))).toBe('');
  });

  it('counts only real tasks', () => {
    expect(getTodoStats([item('a', true), item('b'), item(' ')])).toEqual({ total: 2, done: 1 });
  });

  it('moves items and clamps at the ends', () => {
    const list = ['a', 'b', 'c'];
    expect(moveItem(list, 0, 1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(list, 2, -1)).toEqual(['a', 'c', 'b']);
    expect(moveItem(list, 0, -1)).toBe(list);
    expect(moveItem(list, 2, 5)).toBe(list);
  });
});

describe('wrapText (card layout)', () => {
  const measure = (s: string) => Array.from(s).length; // one unit per character

  it('breaks at spaces', () => {
    expect(wrapText('water the plants today', 10, measure)).toEqual(['water the', 'plants', 'today']);
  });

  it('breaks long words and Japanese text anywhere', () => {
    expect(wrapText('abcdefghij', 4, measure)).toEqual(['abcd', 'efgh', 'ij']);
    expect(wrapText('洗濯して買い物に行く', 4, measure)).toEqual(['洗濯して', '買い物に', '行く']);
  });

  it('ends with an ellipsis when lines run out', () => {
    expect(wrapText('one two three four five', 9, measure, 2)).toEqual(['one two', 'three…']);
    expect(wrapText('abcdefghijkl', 4, measure, 2)).toEqual(['abcd', 'efg…']);
  });
});
