"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Eye,
  EyeOff,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Underline as UnderlineIcon,
} from "lucide-react";
import { Callout } from "@/components/library/editor/callout";
import type { HomeReadPage } from "@/lib/medgenius/home-data";
import {
  loadReadNotes,
  markdownToStudyHtml,
  readPagesToStudyHtml,
  saveReadNotes,
} from "@/lib/medgenius/read-document";

type StudyReadEditorProps = {
  documentId?: string;
  title: string;
  pages: HomeReadPage[];
  rawMarkdown?: string | null;
  accentColor?: string;
};

function ToolbarButton({
  active,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`dn-read-edit-btn${active ? " on" : ""}`}
      title={title}
      aria-label={title}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function StudyReadEditor({
  documentId,
  title,
  pages,
  rawMarkdown,
  accentColor = "#CE82FF",
}: StudyReadEditorProps) {
  const [preview, setPreview] = useState(false);
  const saveTimer = useRef<number | null>(null);

  const initialHtml = useMemo(() => {
    if (documentId) {
      const saved = loadReadNotes(documentId);
      if (saved) return saved;
    }
    if (rawMarkdown?.trim()) return markdownToStudyHtml(rawMarkdown, title);
    return readPagesToStudyHtml(pages, title);
  }, [documentId, pages, rawMarkdown, title]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Callout,
    ],
    content: initialHtml,
    editable: true,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "dn-read-edit-content",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (!documentId) return;
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        saveReadNotes(documentId, ed.getHTML());
      }, 400);
    },
  });

  useEffect(() => {
    return () => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(initialHtml, { emitUpdate: false });
  }, [editor, initialHtml, documentId]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!preview);
  }, [editor, preview]);

  const run = useCallback(
    (fn: () => void) => {
      fn();
      editor?.chain().focus().run();
    },
    [editor]
  );

  if (!editor) {
    return <div className="dn-read-edit-loading">Loading editor…</div>;
  }

  return (
    <div className="dn-read-edit" style={{ ["--read-accent" as string]: accentColor }}>
      <div className="dn-read-edit-card">
        <div className="dn-read-edit-toolbar">
          <div className="dn-read-edit-tools">
            <ToolbarButton
              active={editor.isActive("bold")}
              title="Bold"
              onClick={() => run(() => editor.chain().toggleBold().run())}
            >
              <Bold size={16} strokeWidth={2.4} />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("italic")}
              title="Italic"
              onClick={() => run(() => editor.chain().toggleItalic().run())}
            >
              <Italic size={16} strokeWidth={2.4} />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("underline")}
              title="Underline"
              onClick={() => run(() => editor.chain().toggleUnderline().run())}
            >
              <UnderlineIcon size={16} strokeWidth={2.4} />
            </ToolbarButton>
            <span className="dn-read-edit-divider" aria-hidden />
            <ToolbarButton
              active={editor.isActive("heading", { level: 2 })}
              title="Section heading"
              onClick={() => run(() => editor.chain().toggleHeading({ level: 2 }).run())}
            >
              <Heading2 size={16} strokeWidth={2.4} />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("bulletList")}
              title="Bullet list"
              onClick={() => run(() => editor.chain().toggleBulletList().run())}
            >
              <List size={16} strokeWidth={2.4} />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("orderedList")}
              title="Numbered list"
              onClick={() => run(() => editor.chain().toggleOrderedList().run())}
            >
              <ListOrdered size={16} strokeWidth={2.4} />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("blockquote")}
              title="Quote"
              onClick={() => run(() => editor.chain().toggleBlockquote().run())}
            >
              <Quote size={16} strokeWidth={2.4} />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive("callout")}
              title="Key points box"
              onClick={() => run(() => editor.chain().toggleCallout("note").run())}
            >
              <span className="dn-read-edit-callout-icon">✦</span>
            </ToolbarButton>
          </div>
          <ToolbarButton
            active={preview}
            title={preview ? "Edit" : "Preview"}
            onClick={() => setPreview((value) => !value)}
          >
            {preview ? <EyeOff size={16} strokeWidth={2.4} /> : <Eye size={16} strokeWidth={2.4} />}
          </ToolbarButton>
        </div>
        <div className={`dn-read-edit-scroll${preview ? " is-preview" : ""}`}>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
