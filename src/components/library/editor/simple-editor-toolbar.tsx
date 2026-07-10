"use client";

import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  ChevronRight,
  Code,
  Copy,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Table2,
  Underline,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import { useTiptap, useTiptapState } from "@tiptap/react";
import { ColorHighlightPopover } from "@/components/library/editor/color-highlight-popover";

function ToolbarBtn({
  active,
  disabled,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`tiptap-toolbar-btn ${active ? "is-active" : ""}`}
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** Simple Editor toolbar — Tiptap template style */
export function SimpleEditorToolbar() {
  const { editor } = useTiptap();
  const [headingOpen, setHeadingOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);

  const state = useTiptapState(({ editor: ed }) => ({
    bold: ed.isActive("bold"),
    italic: ed.isActive("italic"),
    strike: ed.isActive("strike"),
    underline: ed.isActive("underline"),
    code: ed.isActive("code"),
    bulletList: ed.isActive("bulletList"),
    orderedList: ed.isActive("orderedList"),
    blockquote: ed.isActive("blockquote"),
    link: ed.isActive("link"),
    alignLeft: ed.isActive({ textAlign: "left" }),
    alignCenter: ed.isActive({ textAlign: "center" }),
    alignRight: ed.isActive({ textAlign: "right" }),
    alignJustify: ed.isActive({ textAlign: "justify" }),
    details: ed.isActive("details"),
    table: ed.isActive("table"),
    canUndo: ed.can().undo(),
    canRedo: ed.can().redo(),
    headingLabel: ed.isActive("heading", { level: 1 })
      ? "Heading 1"
      : ed.isActive("heading", { level: 2 })
        ? "Heading 2"
        : ed.isActive("heading", { level: 3 })
          ? "Heading 3"
          : "Paragraph",
  }));

  if (!editor) return null;

  const run = (fn: () => void) => {
    fn();
    editor.view.focus();
  };

  const copySelection = async () => {
    const { from, to, empty } = editor.state.selection;
    if (empty) return;
    const text = editor.state.doc.textBetween(from, to, "\n");
    await navigator.clipboard.writeText(text);
  };

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertImage = () => {
    const url = window.prompt("Image URL", "https://");
    if (!url?.trim()) return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
  };

  const toggleDetails = () => {
    if (editor.isActive("details")) {
      editor.chain().focus().unsetDetails().run();
      return;
    }
    editor.chain().focus().setDetails().run();
  };

  return (
    <div className="simple-editor-toolbar" role="toolbar" aria-label="Editor">
      <div className="simple-editor-toolbar-group">
        <ToolbarBtn
          title="Undo"
          disabled={!state.canUndo}
          onClick={() => run(() => editor.chain().focus().undo().run())}
        >
          <Undo2 size={16} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Redo"
          disabled={!state.canRedo}
          onClick={() => run(() => editor.chain().focus().redo().run())}
        >
          <Redo2 size={16} strokeWidth={2} />
        </ToolbarBtn>
      </div>

      <span className="tiptap-toolbar-divider" aria-hidden />

      <div className="relative">
        <button
          type="button"
          className="tiptap-heading-trigger"
          aria-expanded={headingOpen}
          onClick={() => setHeadingOpen((v) => !v)}
        >
          {state.headingLabel}
          <ChevronDown size={14} />
        </button>
        {headingOpen ? (
          <div className="tiptap-heading-menu">
            {(
              [
                ["Paragraph", () => editor.chain().focus().setParagraph().run()],
                ["Heading 1", () => editor.chain().focus().toggleHeading({ level: 1 }).run()],
                ["Heading 2", () => editor.chain().focus().toggleHeading({ level: 2 }).run()],
                ["Heading 3", () => editor.chain().focus().toggleHeading({ level: 3 }).run()],
              ] as const
            ).map(([label, action]) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  run(action);
                  setHeadingOpen(false);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <span className="tiptap-toolbar-divider" aria-hidden />

      <div className="simple-editor-toolbar-group">
        <ToolbarBtn
          title="Bullet list"
          active={state.bulletList}
          onClick={() => run(() => editor.chain().focus().toggleBulletList().run())}
        >
          <List size={16} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Ordered list"
          active={state.orderedList}
          onClick={() => run(() => editor.chain().focus().toggleOrderedList().run())}
        >
          <ListOrdered size={16} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Blockquote"
          active={state.blockquote}
          onClick={() => run(() => editor.chain().focus().toggleBlockquote().run())}
        >
          <Quote size={16} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn
          title={state.details ? "Remove details" : "Details"}
          active={state.details}
          onClick={() => run(toggleDetails)}
        >
          <ChevronRight size={16} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn title="Image" onClick={() => run(insertImage)}>
          <ImageIcon size={16} strokeWidth={2} />
        </ToolbarBtn>
      </div>

      <span className="tiptap-toolbar-divider" aria-hidden />

      <div className="relative">
        <button
          type="button"
          className={`tiptap-heading-trigger ${state.table ? "is-active" : ""}`}
          aria-expanded={tableOpen}
          onClick={() => setTableOpen((v) => !v)}
        >
          <Table2 size={16} strokeWidth={2} />
          <ChevronDown size={14} />
        </button>
        {tableOpen ? (
          <div className="tiptap-heading-menu tiptap-table-menu">
            {state.table ? (
              <>
                {(
                  [
                    ["Add row above", () => editor.chain().focus().addRowBefore().run()],
                    ["Add row below", () => editor.chain().focus().addRowAfter().run()],
                    ["Add column left", () => editor.chain().focus().addColumnBefore().run()],
                    ["Add column right", () => editor.chain().focus().addColumnAfter().run()],
                    ["Delete row", () => editor.chain().focus().deleteRow().run()],
                    ["Delete column", () => editor.chain().focus().deleteColumn().run()],
                    ["Delete table", () => editor.chain().focus().deleteTable().run()],
                  ] as const
                ).map(([label, action]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      run(action);
                      if (label === "Delete table") setTableOpen(false);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </>
            ) : (
              <>
                {(
                  [
                    ["3 × 3 with header", () =>
                      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()],
                    ["4 × 4", () =>
                      editor.chain().focus().insertTable({ rows: 4, cols: 4, withHeaderRow: false }).run()],
                    ["5 × 2 with header", () =>
                      editor.chain().focus().insertTable({ rows: 5, cols: 2, withHeaderRow: true }).run()],
                  ] as const
                ).map(([label, action]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      run(action);
                      setTableOpen(false);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </>
            )}
          </div>
        ) : null}
      </div>

      <span className="tiptap-toolbar-divider" aria-hidden />

      <div className="simple-editor-toolbar-group">
        <ToolbarBtn
          title="Bold"
          active={state.bold}
          onClick={() => run(() => editor.chain().focus().toggleBold().run())}
        >
          <Bold size={16} strokeWidth={2.5} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Italic"
          active={state.italic}
          onClick={() => run(() => editor.chain().focus().toggleItalic().run())}
        >
          <Italic size={16} strokeWidth={2.5} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Strikethrough"
          active={state.strike}
          onClick={() => run(() => editor.chain().focus().toggleStrike().run())}
        >
          <Strikethrough size={16} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Code"
          active={state.code}
          onClick={() => run(() => editor.chain().focus().toggleCode().run())}
        >
          <Code size={16} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Underline"
          active={state.underline}
          onClick={() => run(() => editor.chain().focus().toggleUnderline().run())}
        >
          <Underline size={16} strokeWidth={2.5} />
        </ToolbarBtn>
        <ColorHighlightPopover />
        <ToolbarBtn title="Link" active={state.link} onClick={() => run(setLink)}>
          <Link2 size={16} strokeWidth={2} />
        </ToolbarBtn>
      </div>

      <span className="tiptap-toolbar-divider" aria-hidden />

      <div className="simple-editor-toolbar-group">
        <ToolbarBtn
          title="Align left"
          active={state.alignLeft}
          onClick={() => run(() => editor.chain().focus().setTextAlign("left").run())}
        >
          <AlignLeft size={16} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Align center"
          active={state.alignCenter}
          onClick={() => run(() => editor.chain().focus().setTextAlign("center").run())}
        >
          <AlignCenter size={16} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Align right"
          active={state.alignRight}
          onClick={() => run(() => editor.chain().focus().setTextAlign("right").run())}
        >
          <AlignRight size={16} strokeWidth={2} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Justify"
          active={state.alignJustify}
          onClick={() => run(() => editor.chain().focus().setTextAlign("justify").run())}
        >
          <AlignJustify size={16} strokeWidth={2} />
        </ToolbarBtn>
      </div>

      <span className="tiptap-toolbar-divider" aria-hidden />

      <ToolbarBtn title="Copy selection" onClick={() => void copySelection()}>
        <Copy size={16} strokeWidth={2} />
      </ToolbarBtn>
    </div>
  );
}
