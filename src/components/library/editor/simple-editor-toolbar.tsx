"use client";

import {
  Bold,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  ImageIcon,
  Italic,
  Link2,
  MoreHorizontal,
  Redo2,
  Table2,
  Underline,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import { useTiptap, useTiptapState } from "@tiptap/react";
import type { PageSearchItem } from "@/lib/pages";
import { buildInternalLinkAttrs } from "@/lib/pages";
import { ColorHighlightPopover } from "@/components/library/editor/color-highlight-popover";
import { WikiLinkPicker } from "@/components/library/editor/wiki-link/wiki-link-picker";
import { setInternalLinkOnSelection } from "@/components/library/editor/wiki-link/wiki-link-commands";

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

/** Compact single-row toolbar for library reading / annotation. */
export function SimpleEditorToolbar() {
  const { editor } = useTiptap();
  const [tableOpen, setTableOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [wikiPickerOpen, setWikiPickerOpen] = useState(false);

  const state = useTiptapState(({ editor: ed }) => ({
    bold: ed.isActive("bold"),
    italic: ed.isActive("italic"),
    underline: ed.isActive("underline"),
    link: ed.isActive("link"),
    details: ed.isActive("details"),
    table: ed.isActive("table"),
    canUndo: ed.can().undo(),
    canRedo: ed.can().redo(),
  }));

  if (!editor) return null;

  const run = (fn: () => void) => {
    fn();
    editor.view.focus();
    setMoreOpen(false);
  };

  const copySelection = async () => {
    const { from, to, empty } = editor.state.selection;
    if (empty) return;
    const text = editor.state.doc.textBetween(from, to, "\n");
    await navigator.clipboard.writeText(text);
  };

  const setExternalLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("External link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const linkToPage = (item: PageSearchItem) => {
    const attrs = item.exists
      ? buildInternalLinkAttrs({ pageId: item.id, pageTitle: item.title, exists: true })
      : buildInternalLinkAttrs({
          pageId: item.pendingId,
          pageTitle: item.title,
          exists: false,
        });

    const { empty } = editor.state.selection;
    if (empty) {
      window.alert("Select text first, or type [[Page Name]] in the editor.");
      return;
    }
    setInternalLinkOnSelection(editor, attrs);
  };

  const openWikiPicker = () => {
    const { empty } = editor.state.selection;
    if (empty) {
      window.alert("Select text to link, or type [[Page Name]] while reading.");
      return;
    }
    setWikiPickerOpen(true);
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

      <span className="tiptap-toolbar-divider" aria-hidden />

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
        title="Underline"
        active={state.underline}
        onClick={() => run(() => editor.chain().focus().toggleUnderline().run())}
      >
        <Underline size={16} strokeWidth={2.5} />
      </ToolbarBtn>
      <ColorHighlightPopover />

      <span className="tiptap-toolbar-divider" aria-hidden />

      <ToolbarBtn title="Link to page" onClick={() => run(openWikiPicker)}>
        <FileText size={16} strokeWidth={2} />
      </ToolbarBtn>

      <div className="relative">
        <button
          type="button"
          className={`tiptap-heading-trigger tiptap-toolbar-compact-trigger ${state.table ? "is-active" : ""}`}
          aria-expanded={tableOpen}
          aria-label="Table"
          title="Table"
          onClick={() => {
            setTableOpen((v) => !v);
            setMoreOpen(false);
          }}
        >
          <Table2 size={16} strokeWidth={2} />
          <ChevronDown size={12} />
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
                    [
                      "3 × 3 with header",
                      () =>
                        editor
                          .chain()
                          .focus()
                          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                          .run(),
                    ],
                    [
                      "4 × 4",
                      () =>
                        editor
                          .chain()
                          .focus()
                          .insertTable({ rows: 4, cols: 4, withHeaderRow: false })
                          .run(),
                    ],
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

      <ToolbarBtn title="Copy selection" onClick={() => void copySelection()}>
        <Copy size={16} strokeWidth={2} />
      </ToolbarBtn>

      <div className="relative">
        <button
          type="button"
          className="tiptap-toolbar-btn"
          aria-expanded={moreOpen}
          aria-label="More tools"
          title="More"
          onClick={() => {
            setMoreOpen((v) => !v);
            setTableOpen(false);
          }}
        >
          <MoreHorizontal size={16} strokeWidth={2} />
        </button>
        {moreOpen ? (
          <div className="tiptap-heading-menu tiptap-more-menu">
            <button type="button" onClick={() => run(toggleDetails)}>
              {state.details ? "Remove details" : "Details block"}
            </button>
            <button type="button" onClick={() => run(insertImage)}>
              Insert image
            </button>
            <button type="button" onClick={() => run(setExternalLink)}>
              External link
            </button>
          </div>
        ) : null}
      </div>

      <WikiLinkPicker
        open={wikiPickerOpen}
        initialQuery={
          editor.state.selection.empty
            ? ""
            : editor.state.doc.textBetween(
                editor.state.selection.from,
                editor.state.selection.to,
                " "
              )
        }
        onClose={() => setWikiPickerOpen(false)}
        onSelect={(item) => run(() => linkToPage(item))}
      />
    </div>
  );
}
