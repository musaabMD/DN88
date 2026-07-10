"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { useEffect, useMemo } from "react";
import type { LibraryArticle } from "@/lib/set-content";
import { DecorationOnly } from "@/components/library/editor/decoration-only";
import { FontSize } from "@/components/library/editor/font-size";
import { SectionHeading } from "@/components/library/editor/section-heading";
import { articleToTiptapContent } from "@/components/library/editor/article-to-tiptap";
import {
  getArticleEditorContent,
  saveArticleEditorContent,
} from "@/lib/library-editor-preferences";
import { AgentEditorToolbar } from "@/components/library/editor/AgentEditorToolbar";
import { TiptapAgentSidebar } from "@/components/library/editor/TiptapAgentSidebar";

function buildExtensions() {
  return [
    StarterKit.configure({
      heading: false,
      codeBlock: false,
    }),
    SectionHeading,
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    FontSize,
    Underline,
    DecorationOnly,
  ];
}

/**
 * Single-page Tiptap Agent editor for an entire library article.
 * Layout follows Tiptap's AI agent chatbot pattern: document + agent sidebar.
 */
export function LibraryAgentEditor({ article }: { article: LibraryArticle }) {
  const initialContent = useMemo(() => {
    const saved = getArticleEditorContent(article.id);
    return saved ?? articleToTiptapContent(article);
  }, [article]);

  const editor = useEditor({
    extensions: buildExtensions(),
    content: initialContent,
    editable: true,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      saveArticleEditorContent(article.id, ed.getJSON());
    },
    editorProps: {
      attributes: {
        class: "library-agent-content outline-none min-h-[480px]",
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
    <div className="library-agent-editor mt-4">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="library-agent-document rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <AgentEditorToolbar editor={editor} />
          <EditorContent editor={editor} className="mt-4" />
          <p className="mt-4 text-xs font-medium text-slate-400">
            Style only — article text cannot be removed or edited.
          </p>
        </div>
        <TiptapAgentSidebar editor={editor} articleTitle={article.title} />
      </div>
    </div>
  );
}
