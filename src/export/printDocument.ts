import { DOCUMENT_CSS, escapeHtml, renderDocumentBody } from './toHtml';
import type { ExportContext } from './types';

export type PaperStyle = 'plain' | 'ruled' | 'grid' | 'dots' | 'letter';

export interface PrintOptions {
  showTitle: boolean;
  showDate: boolean;
  pageNumbers: boolean;
  /** Keep the on-screen ruled/grid/dot paper in the printout. */
  keepPaper: boolean;
  paper: PaperStyle;
}

export const DEFAULT_PRINT_OPTIONS: Omit<PrintOptions, 'paper'> = {
  showTitle: true,
  showDate: false,
  pageNumbers: true,
  keepPaper: false,
};

const STYLE_ID = 'kaku-print-dynamic';

/**
 * Fills the hidden #print-root with a clean copy of the document. The print
 * stylesheet hides the whole app and shows only this element, so both our
 * Print/PDF buttons and the browser's own Ctrl+P produce the same output.
 */
export function preparePrint(ctx: ExportContext, options: PrintOptions): void {
  const root = document.getElementById('print-root');
  if (!root) return;

  const title = ctx.title.trim() || 'Untitled';
  const header =
    options.showTitle || (options.showDate && ctx.dateLabel)
      ? `<header class="kaku-doc-header">${options.showTitle ? `<h1 class="kaku-doc-title">${escapeHtml(title)}</h1>` : ''}${
          options.showDate && ctx.dateLabel ? `<p class="kaku-doc-date">${escapeHtml(ctx.dateLabel)}</p>` : ''
        }</header>`
      : '';

  root.className = `kaku-doc paper-${options.keepPaper ? options.paper : 'plain'}`;
  root.style.fontFamily = ctx.fontFamily;
  root.innerHTML = header + renderDocumentBody(ctx.doc);

  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = `
    @media print {
      ${DOCUMENT_CSS}
      ${options.pageNumbers ? '@page { @bottom-center { content: counter(page) " / " counter(pages); font: 9pt system-ui, sans-serif; color: #9a948b; } }' : ''}
    }
  `;
  // Use the title as the suggested PDF file name.
  document.title = title;
}

export function cleanupPrint(appTitle: string): void {
  const root = document.getElementById('print-root');
  if (root) root.innerHTML = '';
  document.title = appTitle;
}

/** Opens the browser print dialog (which offers "Save as PDF"). */
export function printDocument(ctx: ExportContext, options: PrintOptions): boolean {
  if (typeof window.print !== 'function') return false;
  preparePrint(ctx, options);
  window.print();
  return true;
}
