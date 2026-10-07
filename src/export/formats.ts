import { toMarkdown } from './toMarkdown';
import { toPlainText } from './toPlainText';
import { toStandaloneHtml } from './toHtml';
import type { ExportContext } from './types';

/**
 * File formats that are generated in the browser and downloaded.
 * Adding a format (DOCX, LaTeX, …) means adding one entry here.
 */
export interface FileFormat {
  id: 'markdown' | 'text' | 'html';
  label: string;
  description: string;
  extension: string;
  mimeType: string;
  build: (ctx: ExportContext) => string;
}

/** Titles left at the default aren't worth writing into the file body. */
function meaningfulTitle(title: string): string | undefined {
  const t = title.trim();
  return t && t !== 'Untitled' ? t : undefined;
}

export const FILE_FORMATS: FileFormat[] = [
  {
    id: 'markdown',
    label: 'Markdown',
    description: 'for GitHub, notes & editors',
    extension: 'md',
    mimeType: 'text/markdown',
    build: (ctx) => toMarkdown(ctx.doc, meaningfulTitle(ctx.title)),
  },
  {
    id: 'text',
    label: 'Plain text',
    description: 'universal .txt file',
    extension: 'txt',
    mimeType: 'text/plain',
    build: (ctx) => toPlainText(ctx.doc, meaningfulTitle(ctx.title)),
  },
  {
    id: 'html',
    label: 'HTML',
    description: 'standalone web page',
    extension: 'html',
    mimeType: 'text/html',
    build: (ctx) => toStandaloneHtml(ctx),
  },
];

export function getFileFormat(id: FileFormat['id']): FileFormat {
  return FILE_FORMATS.find((f) => f.id === id)!;
}
