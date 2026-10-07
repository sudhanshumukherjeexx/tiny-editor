import { describe, expect, it } from 'vitest';
import { toMarkdown, serializeInline } from './toMarkdown';
import { toPlainText } from './toPlainText';
import { toStandaloneHtml, renderDocumentBody } from './toHtml';
import type { DocNode } from './types';

const t = (text: string, ...marks: string[]): DocNode => ({ type: 'text', text, marks: marks.map((type) => ({ type })) });
const p = (...content: DocNode[]): DocNode => ({ type: 'paragraph', content });
const doc = (...content: DocNode[]): DocNode => ({ type: 'doc', content });

const sample = doc(
  p(t('Today I learned something '), t('surprisingly useful', 'bold'), t('.')),
  { type: 'heading', attrs: { level: 2 }, content: [t('Things to remember')] },
  {
    type: 'bulletList',
    content: [
      { type: 'listItem', content: [p(t('Keep systems simple'))] },
      { type: 'listItem', content: [p(t('Write things down'))] },
      { type: 'listItem', content: [p(t('Take breaks'))] },
    ],
  },
  { type: 'blockquote', content: [p(t('Good tools should disappear while you use them.'))] },
  p({ type: 'text', text: 'Learn more', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] }),
);

describe('toMarkdown', () => {
  it('produces clean, readable Markdown', () => {
    expect(toMarkdown(sample, 'Sunday Thoughts')).toBe(
      [
        '# Sunday Thoughts',
        '',
        'Today I learned something **surprisingly useful**.',
        '',
        '## Things to remember',
        '',
        '- Keep systems simple',
        '- Write things down',
        '- Take breaks',
        '',
        '> Good tools should disappear while you use them.',
        '',
        '[Learn more](https://example.com)',
        '',
      ].join('\n'),
    );
  });

  it('nests overlapping marks without breaking syntax', () => {
    expect(serializeInline([t('a', 'bold'), t('b', 'bold', 'italic'), t(' c')])).toBe('**a*b*** c');
    expect(serializeInline([t('bold ', 'bold'), t('plain')])).toBe('**bold** plain');
  });

  it('handles inline code, strike and escaping', () => {
    expect(serializeInline([t('use `x`', 'code')])).toBe('`` use `x` ``');
    expect(serializeInline([t('gone', 'strike')])).toBe('~~gone~~');
    expect(serializeInline([t('2 * 3 = [six]')])).toBe('2 \\* 3 = \\[six\\]');
  });

  it('escapes block syntax at the start of a paragraph', () => {
    expect(toMarkdown(doc(p(t('# not a heading'))))).toBe('\\# not a heading\n');
    expect(toMarkdown(doc(p(t('1. not a list'))))).toBe('1\\. not a list\n');
  });

  it('serialises ordered, nested and task lists', () => {
    const md = toMarkdown(
      doc(
        {
          type: 'orderedList',
          attrs: { start: 1 },
          content: [
            {
              type: 'listItem',
              content: [p(t('one')), { type: 'bulletList', content: [{ type: 'listItem', content: [p(t('inner'))] }] }],
            },
            { type: 'listItem', content: [p(t('two'))] },
          ],
        },
        {
          type: 'taskList',
          content: [
            { type: 'taskItem', attrs: { checked: true }, content: [p(t('done'))] },
            { type: 'taskItem', attrs: { checked: false }, content: [p(t('todo'))] },
          ],
        },
        { type: 'horizontalRule' },
      ),
    );
    expect(md).toBe('1. one\n   - inner\n2. two\n\n- [x] done\n- [ ] todo\n\n---\n');
  });

  it('returns an empty string for an empty document', () => {
    expect(toMarkdown(doc(p()))).toBe('');
  });
});

describe('toPlainText', () => {
  it('strips formatting but keeps structure', () => {
    expect(toPlainText(sample)).toBe(
      'Today I learned something surprisingly useful.\n\nThings to remember\n\n• Keep systems simple\n• Write things down\n• Take breaks\n\n  Good tools should disappear while you use them.\n\nLearn more\n',
    );
  });

  it('keeps hard breaks and includes the title', () => {
    expect(toPlainText(doc(p(t('a'), { type: 'hardBreak' }, t('b'))), 'Note')).toBe('Note\n\na\nb\n');
  });
});

describe('toHtml', () => {
  it('escapes text and drops unsafe links', () => {
    const html = renderDocumentBody(
      doc(
        p(t('<script>alert(1)</script>')),
        p({ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }),
      ),
    );
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('javascript:');
  });

  it('resolves theme colour variables to printable colours', () => {
    const html = renderDocumentBody(doc(p({ type: 'text', text: 'hi', marks: [{ type: 'highlight', attrs: { color: 'var(--hl-sakura)' } }] })));
    expect(html).toContain('background-color: #fadbe1');
  });

  it('builds a standalone page with a restrictive CSP', () => {
    const page = toStandaloneHtml({ title: 'A <b>title</b>', doc: sample, fontFamily: 'serif', dateLabel: '' });
    expect(page).toContain('Content-Security-Policy');
    expect(page).toContain('<title>A &lt;b&gt;title&lt;/b&gt;</title>');
    expect(page).toContain('rel="noopener noreferrer nofollow"');
  });
});
