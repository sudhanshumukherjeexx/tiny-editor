import { resolvePrintColor } from '../themes/palettes';
import { isSafeHref } from '../utils/url';
import type { DocMark, DocNode, ExportContext } from './types';

/**
 * Renders editor JSON to HTML from scratch. Every text node is escaped and
 * only whitelisted attributes are emitted, so pasted or typed content can
 * never inject markup or scripts into exported files.
 */

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const ALIGNMENTS = new Set(['left', 'center', 'right', 'justify']);
const FONT_SIZE = /^\d{1,3}(\.\d+)?(px|pt|em|rem)$/;

function alignAttr(node: DocNode): string {
  const align = node.attrs?.textAlign;
  return typeof align === 'string' && ALIGNMENTS.has(align) && align !== 'left' ? ` style="text-align: ${align}"` : '';
}

function wrapMark(html: string, mark: DocMark): string {
  switch (mark.type) {
    case 'bold':
      return `<strong>${html}</strong>`;
    case 'italic':
      return `<em>${html}</em>`;
    case 'underline':
      return `<u>${html}</u>`;
    case 'strike':
      return `<s>${html}</s>`;
    case 'code':
      return `<code>${html}</code>`;
    case 'link': {
      const href = mark.attrs?.href;
      if (!isSafeHref(href)) return html;
      return `<a href="${escapeHtml(href)}" rel="noopener noreferrer nofollow" target="_blank">${html}</a>`;
    }
    case 'highlight': {
      const color = resolvePrintColor(mark.attrs?.color) ?? '#fbefb0';
      return `<mark style="background-color: ${color}">${html}</mark>`;
    }
    case 'textStyle': {
      const styles: string[] = [];
      const color = resolvePrintColor(mark.attrs?.color);
      if (color) styles.push(`color: ${color}`);
      const size = mark.attrs?.fontSize;
      if (typeof size === 'string' && FONT_SIZE.test(size)) styles.push(`font-size: ${size}`);
      return styles.length ? `<span style="${styles.join('; ')}">${html}</span>` : html;
    }
    default:
      return html;
  }
}

function renderInline(nodes: DocNode[] | undefined): string {
  return (nodes ?? [])
    .map((node) => {
      if (node.type === 'hardBreak') return '<br>';
      if (node.type !== 'text') return '';
      // Wrap so the first mark ends up outermost (links outside bold, etc.).
      return [...(node.marks ?? [])].reverse().reduce((html, mark) => wrapMark(html, mark), escapeHtml(node.text ?? ''));
    })
    .join('');
}

function renderNode(node: DocNode): string {
  switch (node.type) {
    case 'paragraph': {
      const inner = renderInline(node.content);
      return `<p${alignAttr(node)}>${inner || '<br>'}</p>`;
    }
    case 'heading': {
      const level = Math.min(6, Math.max(1, Number(node.attrs?.level ?? 1)));
      return `<h${level}${alignAttr(node)}>${renderInline(node.content)}</h${level}>`;
    }
    case 'blockquote':
      return `<blockquote>${renderNodes(node.content)}</blockquote>`;
    case 'bulletList':
      return `<ul>${renderNodes(node.content)}</ul>`;
    case 'orderedList': {
      const start = Number(node.attrs?.start ?? 1);
      return `<ol${Number.isInteger(start) && start !== 1 ? ` start="${start}"` : ''}>${renderNodes(node.content)}</ol>`;
    }
    case 'listItem':
      return `<li>${renderNodes(node.content)}</li>`;
    case 'taskList':
      return `<ul class="task-list">${renderNodes(node.content)}</ul>`;
    case 'taskItem': {
      const checked = node.attrs?.checked === true;
      return `<li class="task-item${checked ? ' is-checked' : ''}"><span class="task-box" aria-hidden="true">${checked ? '☑' : '☐'}</span><div>${renderNodes(node.content)}</div></li>`;
    }
    case 'codeBlock':
      return `<pre><code>${escapeHtml((node.content ?? []).map((n) => n.text ?? '').join(''))}</code></pre>`;
    case 'horizontalRule':
      return '<hr>';
    case 'text':
    case 'hardBreak':
      return renderInline([node]);
    default:
      return renderNodes(node.content);
  }
}

function renderNodes(nodes: DocNode[] | undefined): string {
  return (nodes ?? []).map(renderNode).join('\n');
}

/** Trims empty paragraphs from the start and end of the document. */
function trimDoc(doc: DocNode): DocNode[] {
  const nodes = [...(doc.content ?? [])];
  const empty = (n: DocNode | undefined) => n?.type === 'paragraph' && !n.content?.length;
  while (empty(nodes[0])) nodes.shift();
  while (empty(nodes[nodes.length - 1])) nodes.pop();
  return nodes;
}

export function renderDocumentBody(doc: DocNode): string {
  return renderNodes(trimDoc(doc));
}

/** Shared document typography for standalone HTML and print. */
export const DOCUMENT_CSS = `
  .kaku-doc { color: #2b2926; line-height: 1.75; font-size: 17px; overflow-wrap: break-word; }
  .kaku-doc-title { font-size: 2em; line-height: 1.2; margin: 0 0 0.2em; font-weight: 700; letter-spacing: -0.01em; }
  .kaku-doc-date { color: #7a746c; font-size: 0.8em; letter-spacing: 0.08em; margin: 0 0 2.2em; }
  .kaku-doc-header { margin-bottom: 2em; }
  .kaku-doc p { margin: 0 0 0.9em; }
  .kaku-doc h1, .kaku-doc h2, .kaku-doc h3 { line-height: 1.3; margin: 1.6em 0 0.5em; font-weight: 700; break-after: avoid; page-break-after: avoid; }
  .kaku-doc h1 { font-size: 1.7em; }
  .kaku-doc h2 { font-size: 1.35em; }
  .kaku-doc h3 { font-size: 1.12em; }
  .kaku-doc > :first-child { margin-top: 0; }
  .kaku-doc blockquote { margin: 1.2em 0; padding: 0.1em 0 0.1em 1.1em; border-left: 2px solid #c9a9a6; color: #57524c; font-style: italic; }
  .kaku-doc ul, .kaku-doc ol { margin: 0 0 0.9em; padding-left: 1.6em; }
  .kaku-doc ul { list-style: disc; }
  .kaku-doc ol { list-style: decimal; }
  .kaku-doc ul ul { list-style: circle; }
  .kaku-doc li { margin: 0.2em 0; }
  .kaku-doc li > p { margin: 0; }
  .kaku-doc .task-list { list-style: none; padding-left: 0.2em; }
  .kaku-doc .task-item { display: flex; gap: 0.55em; align-items: baseline; }
  .kaku-doc .task-item.is-checked > div { color: #8a847b; text-decoration: line-through; }
  .kaku-doc code { font-family: 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace; font-size: 0.86em; background: #f3eee4; padding: 0.12em 0.35em; border-radius: 4px; }
  .kaku-doc pre { background: #f6f2ea; padding: 1em 1.2em; border-radius: 6px; overflow-x: auto; white-space: pre-wrap; break-inside: avoid; }
  .kaku-doc pre code { background: none; padding: 0; }
  .kaku-doc hr { border: none; text-align: center; margin: 2em 0; height: 1em; }
  .kaku-doc hr::after { content: '✿   ✿   ✿'; color: #b9a9a0; font-size: 0.8em; letter-spacing: 0.3em; }
  .kaku-doc a { color: #8c3f48; text-decoration: underline; text-underline-offset: 2px; }
  .kaku-doc mark { color: inherit; padding: 0.05em 0.15em; border-radius: 3px; }
  .kaku-doc p, .kaku-doc li { orphans: 3; widows: 3; }
`;

export function toStandaloneHtml({ title, doc, fontFamily, dateLabel }: ExportContext): string {
  const safeTitle = escapeHtml(title.trim() || 'Untitled');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;">
<meta name="generator" content="Kaku">
<title>${safeTitle}</title>
<style>
  html { background: #f6f2ea; }
  body { margin: 0; padding: 48px 16px; font-family: ${fontFamily}; }
  main { max-width: 720px; margin: 0 auto; background: #fffdf8; padding: 64px 72px; border: 1px solid #e6dece; border-radius: 6px; box-shadow: 0 18px 50px -30px rgba(84, 64, 40, 0.35); }
  @media (max-width: 640px) { body { padding: 0; } main { padding: 32px 22px; border: none; border-radius: 0; } }
  @media print { html, main { background: none; } body { padding: 0; } main { border: none; box-shadow: none; padding: 0; } }
${DOCUMENT_CSS}
</style>
</head>
<body>
<main class="kaku-doc">
<header class="kaku-doc-header">
<h1 class="kaku-doc-title">${safeTitle}</h1>
${dateLabel ? `<p class="kaku-doc-date">${escapeHtml(dateLabel)}</p>` : ''}
</header>
${renderDocumentBody(doc)}
</main>
</body>
</html>
`;
}
