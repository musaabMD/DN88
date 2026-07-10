"use client";

import { useTiptap, useTiptapState } from "@tiptap/react";

/** Fixed menu — https://tiptap.dev/docs/editor/getting-started/style-editor/custom-menus */
export function TiptapMenuBar() {
  const { editor } = useTiptap();

  const active = useTiptapState(({ editor: ed }) => ({
    bold: ed.isActive("bold"),
    italic: ed.isActive("italic"),
    strike: ed.isActive("strike"),
    underline: ed.isActive("underline"),
    highlight: ed.isActive("highlight"),
    bulletList: ed.isActive("bulletList"),
    orderedList: ed.isActive("orderedList"),
  }));

  if (!editor) return null;

  return (
    <div className="tiptap-menu" role="toolbar" aria-label="Formatting">
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
        title="Strike"
        className={active.strike ? "is-active" : undefined}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        Strike
      </button>
      <button
        type="button"
        title="Underline"
        className={active.underline ? "is-active" : undefined}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        Underline
      </button>
      <button
        type="button"
        title="Highlight"
        className={active.highlight ? "is-active" : undefined}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        Highlight
      </button>
      <span className="tiptap-menu-divider" aria-hidden />
      <button
        type="button"
        title="Bullet list"
        className={active.bulletList ? "is-active" : undefined}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        List
      </button>
      <button
        type="button"
        title="Ordered list"
        className={active.orderedList ? "is-active" : undefined}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        Ordered
      </button>
    </div>
  );
}
