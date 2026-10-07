import type { DocNode } from './types';

function inlineText(nodes: DocNode[] | undefined): string {
  return (nodes ?? [])
    .map((n) => (n.type === 'hardBreak' ? '\n' : n.type === 'text' ? (n.text ?? '') : inlineText(n.content)))
    .join('');
}

function indent(text: string, prefix: string, firstPrefix = prefix): string {
  return text
    .split('\n')
    .map((line, i) => (i === 0 ? firstPrefix : prefix) + line)
    .join('\n');
}

function listItem(item: DocNode, marker: string): string {
  const body = (item.content ?? [])
    .map(block)
    .join('\n');
  return indent(body, ' '.repeat(marker.length), marker);
}

function block(node: DocNode): string {
  switch (node.type) {
    case 'paragraph':
    case 'heading':
      return inlineText(node.content);
    case 'blockquote':
      return indent(blocks(node.content), '  ');
    case 'bulletList':
      return (node.content ?? []).map((i) => listItem(i, '• ')).join('\n');
    case 'orderedList': {
      const start = Number(node.attrs?.start ?? 1) || 1;
      return (node.content ?? []).map((i, n) => listItem(i, `${start + n}. `)).join('\n');
    }
    case 'taskList':
      return (node.content ?? []).map((i) => listItem(i, i.attrs?.checked ? '[x] ' : '[ ] ')).join('\n');
    case 'codeBlock':
      return inlineText(node.content);
    case 'horizontalRule':
      return '* * *';
    default:
      return node.content ? blocks(node.content) : inlineText([node]);
  }
}

function blocks(nodes: DocNode[] | undefined): string {
  return (nodes ?? [])
    .map(block)
    .filter((s) => s.trim() !== '')
    .join('\n\n');
}

/** Plain text with formatting stripped but structure (lists, breaks) kept. */
export function toPlainText(doc: DocNode, title?: string): string {
  const body = blocks(doc.content).trim();
  const parts = [title?.trim() ?? '', body].filter(Boolean);
  return parts.length ? `${parts.join('\n\n')}\n` : '';
}
