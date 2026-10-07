import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ClipboardCopy, Download, Printer } from 'lucide-react';
import { useUI } from '../../app/ui';
import type { Exporter } from '../../hooks/useExporter';
import type { PrintOptions } from '../../export/printDocument';
import { FILE_FORMATS, type FileFormat } from '../../export/formats';
import { shortcut } from '../../utils/platform';
import { Popover } from '../ui/Popover';

const GLYPHS: Record<FileFormat['id'] | 'pdf', string> = {
  pdf: '▣',
  markdown: '#',
  text: '≡',
  html: '<>',
};

interface ExportMenuProps {
  exporter: Exporter;
  printOptions: PrintOptions;
  onPrintOptionsChange: (patch: Partial<PrintOptions>) => void;
}

export function ExportMenu({ exporter, printOptions, onPrintOptionsChange }: ExportMenuProps) {
  const { openPanel, togglePanel, closePanel } = useUI();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [done, setDone] = useState(false);
  const [showPdfOptions, setShowPdfOptions] = useState(false);
  const open = openPanel === 'export';

  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(() => setDone(false), 1800);
    return () => window.clearTimeout(id);
  }, [done]);

  const run = (ok: boolean) => {
    if (ok) setDone(true);
    closePanel();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`export-btn ${done ? 'is-done' : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        data-tip="Export"
        data-kbd={shortcut('mod+shift+s')}
        onClick={() => togglePanel('export')}
      >
        <span className="export-icon" aria-hidden="true">
          {done ? <Check size={15} strokeWidth={2.25} /> : <Download size={15} strokeWidth={1.9} />}
        </span>
        <span className="export-label">{done ? 'exported' : 'Export'}</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {done ? 'Exported' : ''}
      </span>

      <Popover open={open} onClose={closePanel} anchor={buttonRef} label="Export" align="end" className="w-export" role="menu">
        <div className="panel-body">
          <p className="panel-label">Export</p>

          <div className="export-item-wrap">
            <button type="button" role="menuitem" className="export-item" onClick={() => run(exporter.print())}>
              <span className="export-glyph" aria-hidden="true">
                {GLYPHS.pdf}
              </span>
              <span className="export-text">
                <span className="export-name">PDF</span>
                <span className="export-desc">beautiful print-ready document</span>
              </span>
            </button>
            <button
              type="button"
              className={`export-options-toggle ${showPdfOptions ? 'is-open' : ''}`}
              aria-expanded={showPdfOptions}
              aria-controls="kaku-pdf-options"
              aria-label="PDF options"
              data-tip="PDF options"
              onClick={() => setShowPdfOptions((v) => !v)}
            >
              <ChevronDown size={14} strokeWidth={2} />
            </button>
          </div>
          {showPdfOptions && (
            <fieldset id="kaku-pdf-options" className="pdf-options">
              <legend className="sr-only">PDF options</legend>
              {(
                [
                  ['showTitle', 'Title'],
                  ['showDate', 'Date'],
                  ['pageNumbers', 'Page numbers'],
                  ['keepPaper', 'Keep paper style'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="check">
                  <input type="checkbox" checked={printOptions[key]} onChange={(e) => onPrintOptionsChange({ [key]: e.target.checked })} />
                  <span>{label}</span>
                </label>
              ))}
              <p className="pdf-hint">Choose “Save as PDF” in the print dialog.</p>
            </fieldset>
          )}

          {FILE_FORMATS.map((format) => (
            <button key={format.id} type="button" role="menuitem" className="export-item" onClick={() => run(exporter.download(format.id))}>
              <span className="export-glyph" aria-hidden="true">
                {GLYPHS[format.id]}
              </span>
              <span className="export-text">
                <span className="export-name">{format.label}</span>
                <span className="export-desc">{format.description}</span>
              </span>
              <span className="export-ext">.{format.extension}</span>
            </button>
          ))}

          <div className="menu-divider" />

          <button type="button" role="menuitem" className="menu-item compact" onClick={async () => run(await exporter.copyMarkdown())}>
            <ClipboardCopy size={15} strokeWidth={1.75} aria-hidden="true" />
            <span>Copy Markdown</span>
          </button>
          <button type="button" role="menuitem" className="menu-item compact" onClick={async () => run(await exporter.copyPlainText())}>
            <ClipboardCopy size={15} strokeWidth={1.75} aria-hidden="true" />
            <span>Copy text</span>
          </button>
          <button type="button" role="menuitem" className="menu-item compact" onClick={() => run(exporter.print())}>
            <Printer size={15} strokeWidth={1.75} aria-hidden="true" />
            <span>Print</span>
            <kbd className="menu-kbd">{shortcut('mod+p')}</kbd>
          </button>
          <p className="panel-foot">Files are created right here in your browser.</p>
        </div>
      </Popover>
    </>
  );
}
