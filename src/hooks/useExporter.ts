import { useCallback, useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { useUI } from '../app/ui';
import { COPY } from '../app/copy';
import { BRAND } from '../config/brand';
import { getFileFormat, type FileFormat } from '../export/formats';
import { cleanupPrint, preparePrint, type PrintOptions } from '../export/printDocument';
import { toMarkdown } from '../export/toMarkdown';
import { toPlainText } from '../export/toPlainText';
import type { DocNode, ExportContext } from '../export/types';
import { copyText } from '../utils/clipboard';
import { downloadFile } from '../utils/download';
import { fileNameWithExtension } from '../utils/fileName';

interface ExporterOptions {
  editor: Editor;
  title: string;
  fontFamily: string;
  dateLabel: string;
  printOptions: PrintOptions;
}

export interface Exporter {
  download: (id: FileFormat['id']) => boolean;
  print: () => boolean;
  copyMarkdown: () => Promise<boolean>;
  copyPlainText: () => Promise<boolean>;
}

/** All export actions, isolated from UI. Returns true on success. */
export function useExporter({ editor, title, fontFamily, dateLabel, printOptions }: ExporterOptions): Exporter {
  const { notify } = useUI();
  const latest = useRef({ title, fontFamily, dateLabel, printOptions });
  latest.current = { title, fontFamily, dateLabel, printOptions };

  const context = useCallback((): ExportContext => {
    const { title: t, fontFamily: f, dateLabel: d } = latest.current;
    return { title: t, doc: editor.getJSON() as DocNode, fontFamily: f, dateLabel: d };
  }, [editor]);

  const ensureContent = useCallback(() => {
    if (editor.isEmpty || !editor.getText().trim()) {
      notify(COPY.emptyExport);
      return false;
    }
    return true;
  }, [editor, notify]);

  // Route the browser's own Ctrl/Cmd+P through the same clean print view.
  useEffect(() => {
    const before = () => preparePrint(context(), latest.current.printOptions);
    const after = () => cleanupPrint(`${BRAND.name} — ${BRAND.tagline}`);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, [context]);

  const download = useCallback(
    (id: FileFormat['id']) => {
      if (!ensureContent()) return false;
      try {
        const format = getFileFormat(id);
        const ctx = context();
        downloadFile(format.build(ctx), fileNameWithExtension(ctx.title, format.extension), format.mimeType);
        return true;
      } catch {
        notify(COPY.exportFailed, 'error');
        return false;
      }
    },
    [context, ensureContent, notify],
  );

  const print = useCallback(() => {
    if (!ensureContent()) return false;
    if (typeof window.print !== 'function') {
      notify(COPY.printUnavailable, 'error');
      return false;
    }
    try {
      preparePrint(context(), latest.current.printOptions);
      window.print();
      return true;
    } catch {
      notify(COPY.exportFailed, 'error');
      return false;
    }
  }, [context, ensureContent, notify]);

  const copy = useCallback(
    async (build: (ctx: ExportContext) => string, success: string) => {
      if (!ensureContent()) return false;
      try {
        await copyText(build(context()));
        notify(success, 'success');
        return true;
      } catch {
        notify(COPY.clipboardFailed, 'error');
        return false;
      }
    },
    [context, ensureContent, notify],
  );

  const copyMarkdown = useCallback(() => copy((c) => toMarkdown(c.doc), COPY.copiedMarkdown), [copy]);
  const copyPlainText = useCallback(() => copy((c) => toPlainText(c.doc), COPY.copiedText), [copy]);

  return { download, print, copyMarkdown, copyPlainText };
}
