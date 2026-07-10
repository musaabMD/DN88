"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { useEffect, useMemo } from "react";
import type { LibraryEditorMode } from "@/components/library/editor/types";
import { DecorationOnly } from "@/components/library/editor/decoration-only";
import { FontSize } from "@/components/library/editor/font-size";
import { LibraryEditorToolbar } from "@/components/library/editor/LibraryEditorToolbar";
import {
  getSectionContent,
  saveSectionContent,
} from "@/lib/library-editor-preferences";
import { sectionToTiptapContent } from "@/components/library/editor/article-to-tiptap";
import type { LibraryArticleSection } from "@/lib/set-content";

function buildExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      codeBlock: false,
    }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    FontFamily,
    FontSize,
    Underline,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Link.configure({ openOnClick: false, autolink: false }),
    DecorationOnly,
  ];
}

export function LibraryTiptapSection({
  articleId,
  section,
  mode,
  zoom = 100,
}: {
  articleId: string;
  section: LibraryArticleSection;
  mode: LibraryEditorMode;
  zoom?: number;
}) {
  const initialContent = useMemo(() => {
    const saved = getSectionContent(articleId, section.id);
    return saved ?? sectionToTiptapContent(section);
  }, [articleId, section]);

  const editor = useEditor({
    extensions: buildExtensions(),
    content: initialContent,
    editable: true,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      saveSectionContent(articleId, section.id, ed.getJSON());
    },
    editorProps: {
      attributes: {
        class: "library-tiptap-content outline-none",
        spellcheck: "false",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const saved = getSectionContent(articleId, section.id);
    const next = saved ?? sectionToTiptapContent(section);
    const current = JSON.stringify(editor.getJSON());
    const incoming = JSON.stringify(next);
    if (current !== incoming && !saved) {
      editor.commands.setContent(next as JSONContent);
    }
  }, [articleId, section, editor]);

  if (!editor) return null;

  return (
    <div
      className={`library-tiptap-section ${
        mode === "notion" ? "library-tiptap-section--notion" : ""
      } ${mode === "docx" ? "library-tiptap-section--docx" : ""}`}
      style={{ fontSize: `${zoom}%` }}
    >
      {mode !== "notion" ? (
        <LibraryEditorToolbar editor={editor} mode={mode} zoom={zoom} />
      ) : (
        <LibraryEditorToolbar editor={editor} mode={mode} compact zoom={zoom} />
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
