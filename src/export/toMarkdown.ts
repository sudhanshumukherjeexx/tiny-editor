import type { DocMark, DocNode } from './types';

/**
 * Serialises editor JSON into clean, readable CommonMark/GFM.
 * Formatting with no Markdown equivalent (underline, colour, highlight,
 * alignment) is dropped rather than emitted as HTML.
 */

const MARK_ORDER = ['link', 'bold', 'italic', 'strike', 'code'] as const;
type SupportedMark = (typeof MARK_ORDER)[number];

function supportedMarks(marks: DocMark[] | undefined): DocMark[] {
  return (marks ?? [])
    .filter((m) => (MARK_ORDER as readonly string[]).includes(m.type))
    .sort((a, b) => MARK_ORDER.indexOf(a.type as SupportedMark) - MARK_ORDER.indexOf(b.type as SupportedMark));
}

function sameMark(a: DocMark, b: DocMark): boolean {
  return a.type === b.type && (a.type !== 'link' || a.attrs?.href === b.attrs?.href);
}

function escapeLinkUrl(href: string): string {
  return href.replace(/[()\s<>]/g, (c) => encodeURIComponent(c));
}

function openMark(mark: DocMark): string {
  switch (mark.type) {
    case 'link':
      return '[';
    case 'bold':
      return '**';
    case 'italic':
      return '*';
    case 'strike':
      return '~~';
    default:
      return '';
  }
}

function closeMark(mark: DocMark): string {
  if (mark.type === 'link') return `](${escapeLinkUrl(String(mark.attrs?.href ?? ''))})`;
  return openMark(mark);
}

export function escapeMarkdownText(text: string): string {
  return text.replace(/([\\`*_[\]<~])/g, '\\$1');
}

/** Escapes characters that would turn the start of a line into block syntax. */
function escapeLineStart(line: string): string {
  return line
    .replace(/^(\s*)(#{1,6})(\s|$)/, '$1\\$2$3')
    .replace(/^(\s*)([+-])(\s)/, '$1\\$2$3')
    .replace(/^(\s*)(\d+)([.)])(\s)/, '$1$2\\$3$4')
    .replace(/^(\s*)(=+|-{3,})\s*$/, '$1\\$2');
}

function inlineCode(text: string): string {
  const longest = Math.max(0, ...(text.match(/`+/g) ?? []).map((s) => s.length));
  const fence = '`'.repeat(longest + 1);
  const pad = text.startsWith('`') || text.endsWith('`') ? ' ' : '';
  return `${fence}${pad}${text}${pad}${fence}`;
}

export function serializeInline(nodes: DocNode[] | undefined): string {
  let out = '';
  let pendingSpace = '';
  const active: DocMark[] = [];

  const closeTo = (depth: number) => {
    while (active.length > depth) out += closeMark(active.pop()!);
  };

  for (const node of nodes ?? []) {
    if (node.type === 'hardBreak') {
      closeTo(0);
      out += `${pendingSpace.replace(/\s+$/, '')}  \n`;
      pendingSpace = '';
      continue;
    }
    if (node.type !== 'text' || !node.text) continue;

    const marks = supportedMarks(node.marks);
    const text = node.text;
    const lead = text.match(/^\s*/)![0];
    const trail = text.slice(lead.length).match(/\s*$/)![0];
    const core = text.slice(lead.length, text.length - trail.length);

    if (!core) {
      pendingSpace += text;
      continue;
    }

    let keep = 0;
    while (keep < active.length && keep < marks.length && sameMark(active[keep], marks[keep])) keep++;
    // Code must be the innermost mark and can't contain other marks.
    if (active.some((m) => m.type === 'code')) keep = Math.min(keep, active.findIndex((m) => m.type === 'code'));
    closeTo(keep);

    out += pendingSpace + lead;
    pendingSpace = trail;

    const hasCode = marks.some((m) => m.type === 'code');
    for (const mark of marks.slice(keep)) {
      if (mark.type === 'code') continue;
      out += openMark(mark);
      active.push(mark);
    }
    if (hasCode) out += inlineCode(core);
    else out += escapeMarkdownText(core);
  }

  closeTo(0);
  return out + pendingSpace.replace(/\n/g, ' ');
}

function indent(text: string, prefix: string, firstPrefix = prefix): string {
  return text
    .split('\n')
    .map((line, i) => (i === 0 ? firstPrefix : line ? prefix : prefix.trimEnd()) + line)
    .join('\n');
}

function serializeListItem(item: DocNode, marker: string): string {
  const children = item.content ?? [];
  let body = '';
  children.forEach((child, i) => {
    const isList = /List$/.test(child.type);
    const chunk = serializeBlock(child);
    if (i === 0) body = chunk;
    else body += (isList ? '\n' : '\n\n') + chunk;
  });
  return indent(body, ' '.repeat(marker.length), marker);
}

function serializeBlock(node: DocNode): string {
  switch (node.type) {
    case 'paragraph':
      return escapeLineStart(serializeInline(node.content));
    case 'heading': {
      const level = Math.min(6, Math.max(1, Number(node.attrs?.level ?? 1)));
      return `${'#'.repeat(level)} ${serializeInline(node.content).replace(/\s*\n\s*/g, ' ')}`;
    }
    case 'blockquote':
      return indent(serializeBlocks(node.content), '> ');
    case 'bulletList':
      return (node.content ?? []).map((item) => serializeListItem(item, '- ')).join('\n');
    case 'orderedList': {
      const start = Number(node.attrs?.start ?? 1) || 1;
      return (node.content ?? []).map((item, i) => serializeListItem(item, `${start + i}. `)).join('\n');
    }
    case 'taskList':
      return (node.content ?? [])
        .map((item) => serializeListItem(item, item.attrs?.checked ? '- [x] ' : '- [ ] '))
        .join('\n');
    case 'codeBlock': {
      const code = (node.content ?? []).map((n) => n.text ?? '').join('');
      const longest = Math.max(2, ...(code.match(/`+/g) ?? []).map((s) => s.length));
      const fence = '`'.repeat(longest + 1);
      const lang = typeof node.attrs?.language === 'string' ? node.attrs.language : '';
      return `${fence}${lang}\n${code}\n${fence}`;
    }
    case 'horizontalRule':
      return '---';
    default:
      return node.content ? serializeBlocks(node.content) : serializeInline([node]);
  }
}

function isEmptyParagraph(node: DocNode): boolean {
  return node.type === 'paragraph' && !(node.content ?? []).some((n) => n.type !== 'text' || n.text?.trim());
}

function serializeBlocks(nodes: DocNode[] | undefined): string {
  return (nodes ?? [])
    .filter((n) => !isEmptyParagraph(n))
    .map(serializeBlock)
    .join('\n\n');
}

export function toMarkdown(doc: DocNode, title?: string): string {
  const body = serializeBlocks(doc.content).trim();
  const heading = title?.trim() ? `# ${escapeMarkdownText(title.trim())}` : '';
  const startsWithSameHeading =
    doc.content?.[0]?.type === 'heading' && serializeInline(doc.content[0].content).trim() === escapeMarkdownText(title?.trim() ?? '');
  const parts = [startsWithSameHeading ? '' : heading, body].filter(Boolean);
  return parts.length ? `${parts.join('\n\n')}\n` : '';
}
