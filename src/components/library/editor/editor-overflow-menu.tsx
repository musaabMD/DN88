"use client";

import { Maximize2, Minus, Plus, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="simple-editor-icon-btn"
      title={title}
      aria-label={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** Reader settings menu — zoom controls only. */
export function EditorOverflowMenu({
  currentZoom,
  onZoomChange,
  onFitToPage,
}: {
  currentZoom: ZoomLevel;
  onZoomChange: (zoom: ZoomLevel) => void;
  onFitToPage?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const zoom = clampZoom(currentZoom, ZOOM_MIN, ZOOM_MAX);
  const isMinZoom = zoom <= ZOOM_MIN;
  const isMaxZoom = zoom >= ZOOM_MAX;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const setZoom = (value: number) => {
    onZoomChange(clampZoom(value, ZOOM_MIN, ZOOM_MAX));
  };

  return (
    <div className="relative" ref={rootRef}>
      <IconBtn title="Settings" onClick={() => setOpen((v) => !v)}>
        <Settings size={18} strokeWidth={2} />
      </IconBtn>

      {open ? (
        <div className="tiptap-heading-menu tiptap-more-menu simple-editor-overflow-menu simple-editor-settings-menu">
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
                  setZoom(
                    getNextPresetZoom(zoom, "down", ZOOM_PRESETS, ZOOM_MIN, ZOOM_MAX)
                  )
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
                  setZoom(
                    getNextPresetZoom(zoom, "up", ZOOM_PRESETS, ZOOM_MIN, ZOOM_MAX)
                  )
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
                onClick={() => {
                  onFitToPage();
                  setOpen(false);
                }}
              >
                <Maximize2 size={14} />
                Fit to page
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
