"use client";

import { BubbleMenu } from "@tiptap/react/menus";
import { useTiptap, useTiptapState } from "@tiptap/react";

/** Bubble menu — https://tiptap.dev/docs/editor/getting-started/style-editor/custom-menus */
export function TiptapBubbleMenu() {
  const { editor } = useTiptap();

  const active = useTiptapState(({ editor: ed }) => ({
    bold: ed.isActive("bold"),
    italic: ed.isActive("italic"),
    highlight: ed.isActive("highlight"),
  }));

  if (!editor) return null;

  return (
    <BubbleMenu editor={editor} className="tiptap-bubble-menu">
      <button
        type="button"
        title="Bold"
        className={active.bold ? "is-active" : undefined}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        Bold
      </button>
      <button
        type="button"
        title="Italic"
        className={active.italic ? "is-active" : undefined}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        Italic
      </button>
      <button
        type="button"
        title="Highlight"
        className={active.highlight ? "is-active" : undefined}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        Highlight
      </button>
    </BubbleMenu>
  );
}
