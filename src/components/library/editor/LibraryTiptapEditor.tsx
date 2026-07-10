"use client";

import { Tiptap, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { useEffect, useMemo } from "react";
import type { LibraryArticle } from "@/lib/set-content";
import { DecorationOnly } from "@/components/library/editor/decoration-only";
import { SectionHeading } from "@/components/library/editor/section-heading";
import { articleToTiptapContent } from "@/components/library/editor/article-to-tiptap";
import {
  getArticleEditorContent,
  saveArticleEditorContent,
} from "@/lib/library-editor-preferences";
import { TiptapMenuBar } from "@/components/library/editor/TiptapMenuBar";
import { TiptapBubbleMenu } from "@/components/library/editor/TiptapBubbleMenu";

/**
 * Library article editor — official Tiptap Next.js pattern.
 * @see https://tiptap.dev/docs/editor/getting-started/install/nextjs
 */
export function LibraryTiptapEditor({ article }: { article: LibraryArticle }) {
  const initialContent = useMemo(() => {
    const saved = getArticleEditorContent(article.id);
    return saved ?? articleToTiptapContent(article);
  }, [article]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
      }),
      SectionHeading,
      Highlight.configure({ multicolor: true }),
      Underline,
      DecorationOnly,
    ],
    content: initialContent,
    editable: true,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      saveArticleEditorContent(article.id, ed.getJSON());
    },
    editorProps: {
      attributes: {
        class: "tiptap",
        spellcheck: "false",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const saved = getArticleEditorContent(article.id);
    if (!saved) {
      editor.commands.setContent(articleToTiptapContent(article));
    }
  }, [article, editor]);

  if (!editor) return null;

  return (
    <div className="library-tiptap-editor">
      <Tiptap editor={editor}>
        <TiptapMenuBar />
        <Tiptap.Content />
        <TiptapBubbleMenu />
      </Tiptap>
    </div>
  );
}
