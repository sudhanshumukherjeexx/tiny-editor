import { useEditorState, type Editor } from '@tiptap/react';
import { getBlockType } from '../../editor/editorCommands';

/** Subscribes to just the editor facts the toolbar renders. */
export function useToolbarState(editor: Editor) {
  return useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      code: e.isActive('code'),
      codeBlock: e.isActive('codeBlock'),
      bulletList: e.isActive('bulletList'),
      orderedList: e.isActive('orderedList'),
      taskList: e.isActive('taskList'),
      blockquote: e.isActive('blockquote'),
      link: e.isActive('link'),
      highlight: e.isActive('highlight'),
      highlightColor: (e.getAttributes('highlight').color as string | undefined) ?? null,
      color: (e.getAttributes('textStyle').color as string | undefined) ?? null,
      fontSize: (e.getAttributes('textStyle').fontSize as string | undefined) ?? null,
      block: getBlockType(e),
      align: e.isActive({ textAlign: 'center' }) ? 'center' : e.isActive({ textAlign: 'right' }) ? 'right' : 'left',
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      hasSelection: !e.state.selection.empty,
    }),
  });
}

export type ToolbarState = ReturnType<typeof useToolbarState>;
