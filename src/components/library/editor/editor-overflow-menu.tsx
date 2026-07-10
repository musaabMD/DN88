"use client";

import { ImageIcon, MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";

function IconBtn({
  title,
  disabled,
  onClick,
  children,
}: {
  title: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="simple-editor-icon-btn"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** Secondary tools in the header overflow menu. */
export function EditorOverflowMenu({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setTableOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const run = (fn: () => void) => {
    fn();
    editor.view.focus();
    setOpen(false);
    setTableOpen(false);
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
    <div className="relative" ref={rootRef}>
      <IconBtn title="More" onClick={() => setOpen((v) => !v)}>
        <MoreHorizontal size={18} strokeWidth={2} />
      </IconBtn>

      {open ? (
        <div className="tiptap-heading-menu tiptap-more-menu simple-editor-overflow-menu">
          <button
            type="button"
            disabled={!editor.can().undo()}
            onClick={() => run(() => editor.chain().focus().undo().run())}
          >
            Undo
          </button>
          <button
            type="button"
            disabled={!editor.can().redo()}
            onClick={() => run(() => editor.chain().focus().redo().run())}
          >
            Redo
          </button>
          <button type="button" onClick={() => setTableOpen((v) => !v)}>
            Table…
          </button>
          {tableOpen ? (
            <div className="simple-editor-submenu">
              {editor.isActive("table") ? (
                <>
                  {(
                    [
                      ["Add row above", () => editor.chain().focus().addRowBefore().run()],
                      ["Add row below", () => editor.chain().focus().addRowAfter().run()],
                      ["Delete table", () => editor.chain().focus().deleteTable().run()],
                    ] as const
                  ).map(([label, action]) => (
                    <button key={label} type="button" onClick={() => run(action)}>
                      {label}
                    </button>
                  ))}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    run(() =>
                      editor
                        .chain()
                        .focus()
                        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                        .run()
                    )
                  }
                >
                  Insert 3×3 table
                </button>
              )}
            </div>
          ) : null}
          <button type="button" onClick={() => run(toggleDetails)}>
            {editor.isActive("details") ? "Remove details" : "Details block"}
          </button>
          <button type="button" onClick={() => run(insertImage)}>
            <ImageIcon size={14} strokeWidth={2} aria-hidden />
            Insert image
          </button>
        </div>
      ) : null}
    </div>
  );
}
