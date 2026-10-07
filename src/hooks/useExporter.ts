import { useCallback, useEffect, useRef } from 'react';
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

/** Whatever is being exported: the note, or the to-do list. */
export interface ExportSource {
  getDoc: () => DocNode;
  isEmpty: () => boolean;
  /** Renders a PNG card, for sources that support one. */
  renderCard?: () => Promise<Blob>;
}

interface ExporterOptions {
  source: ExportSource;
  title: string;
  fontFamily: string;
  dateLabel: string;
  printOptions: PrintOptions;
}

export interface Exporter {
  download: (id: FileFormat['id']) => boolean;
  /** Undefined when the current document can't be drawn as a card. */
  downloadCard?: () => Promise<boolean>;
  print: () => boolean;
  copyMarkdown: () => Promise<boolean>;
  copyPlainText: () => Promise<boolean>;
}

/** All export actions, isolated from UI. Returns true on success. */
export function useExporter({ source, title, fontFamily, dateLabel, printOptions }: ExporterOptions): Exporter {
  const { notify } = useUI();
  const latest = useRef({ source, title, fontFamily, dateLabel, printOptions });
  latest.current = { source, title, fontFamily, dateLabel, printOptions };

  const context = useCallback((): ExportContext => {
    const { source: s, title: t, fontFamily: f, dateLabel: d } = latest.current;
    return { title: t, doc: s.getDoc(), fontFamily: f, dateLabel: d };
  }, []);

  const ensureContent = useCallback(() => {
    if (latest.current.source.isEmpty()) {
      notify(COPY.emptyExport);
      return false;
    }
    return true;
  }, [notify]);

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

  const downloadCard = useCallback(async () => {
    const render = latest.current.source.renderCard;
    if (!render || !ensureContent()) return false;
    try {
      downloadFile(await render(), fileNameWithExtension(latest.current.title, 'png'));
      return true;
    } catch {
      notify(COPY.exportFailed, 'error');
      return false;
    }
  }, [ensureContent, notify]);

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

  return { download, downloadCard: source.renderCard ? downloadCard : undefined, print, copyMarkdown, copyPlainText };
}
