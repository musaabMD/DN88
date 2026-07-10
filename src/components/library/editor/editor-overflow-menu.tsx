"use client";

import { ImageIcon, Maximize2, Minus, Plus, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import {
  clampZoom,
  getNextPresetZoom,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_PRESETS,
  type ZoomLevel,
} from "@/components/library/editor/zoom-dropdown-menu";

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

function SettingsZoomSection({
  currentZoom,
  onZoomChange,
  onFitToPage,
}: {
  currentZoom: ZoomLevel;
  onZoomChange: (zoom: ZoomLevel) => void;
  onFitToPage?: () => void;
}) {
  const zoom = clampZoom(currentZoom, ZOOM_MIN, ZOOM_MAX);
  const isMinZoom = zoom <= ZOOM_MIN;
  const isMaxZoom = zoom >= ZOOM_MAX;

  const setZoom = (value: number) => {
    onZoomChange(clampZoom(value, ZOOM_MIN, ZOOM_MAX));
  };

  return (
    <div className="simple-editor-settings-zoom">
      <p className="simple-editor-settings-label">Zoom</p>
      <div className="simple-editor-settings-zoom-controls">
        <button
          type="button"
          className="tiptap-toolbar-btn"
          title="Zoom out"
          aria-label="Zoom out"
          disabled={isMinZoom}
          onClick={() =>
            setZoom(getNextPresetZoom(zoom, "down", ZOOM_PRESETS, ZOOM_MIN, ZOOM_MAX))
          }
        >
          <Minus size={16} strokeWidth={2} />
        </button>
        <span className="simple-editor-settings-zoom-value">{zoom}%</span>
        <button
          type="button"
          className="tiptap-toolbar-btn"
          title="Zoom in"
          aria-label="Zoom in"
          disabled={isMaxZoom}
          onClick={() =>
            setZoom(getNextPresetZoom(zoom, "up", ZOOM_PRESETS, ZOOM_MIN, ZOOM_MAX))
          }
        >
          <Plus size={16} strokeWidth={2} />
        </button>
      </div>
      <div className="tiptap-zoom-presets simple-editor-settings-zoom-presets">
        {ZOOM_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className={preset === zoom ? "is-active" : undefined}
            onClick={() => setZoom(preset)}
          >
            {preset}%
          </button>
        ))}
      </div>
      {onFitToPage ? (
        <button
          type="button"
          className="tiptap-zoom-fit"
          onClick={onFitToPage}
        >
          <Maximize2 size={14} />
          Fit to page
        </button>
      ) : null}
    </div>
  );
}

/** Editor settings menu — zoom, undo/redo, tables, and insert tools. */
export function EditorOverflowMenu({
  editor,
  currentZoom,
  onZoomChange,
  onFitToPage,
}: {
  editor: Editor;
  currentZoom: ZoomLevel;
  onZoomChange: (zoom: ZoomLevel) => void;
  onFitToPage?: () => void;
}) {
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
      <IconBtn title="Settings" onClick={() => setOpen((v) => !v)}>
        <Settings size={18} strokeWidth={2} />
      </IconBtn>

      {open ? (
        <div className="tiptap-heading-menu tiptap-more-menu simple-editor-overflow-menu simple-editor-settings-menu">
          <SettingsZoomSection
            currentZoom={currentZoom}
            onZoomChange={onZoomChange}
            onFitToPage={onFitToPage}
          />
          <div className="simple-editor-settings-divider" />
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
