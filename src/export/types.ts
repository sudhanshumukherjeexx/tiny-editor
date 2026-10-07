/** Minimal structural type for Tiptap/ProseMirror JSON. */
export interface DocMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface DocNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  marks?: DocMark[];
  text?: string;
}

export interface ExportContext {
  title: string;
  doc: DocNode;
  fontFamily: string;
  /** Formatted date line, or empty when the date is hidden. */
  dateLabel: string;
}
