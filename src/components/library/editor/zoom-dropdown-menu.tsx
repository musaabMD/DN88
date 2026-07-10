"use client";

import { useCallback, useState } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";

export const ZOOM_MIN = 40;
export const ZOOM_MAX = 200;
export const ZOOM_DEFAULT = 100;
export const ZOOM_PRESETS = [40, 50, 75, 90, 100, 125, 150, 175, 200] as const;
export type ZoomLevel = number;

export function clampZoom(
  value: number,
  min: number = ZOOM_MIN,
  max: number = ZOOM_MAX
): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function parsePercent(input: string): number | null {
  const trimmed = input.trim().replace(/%$/, "");
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : null;
}

export function getNextPresetZoom(
  currentZoom: number,
  direction: "up" | "down",
  presets: readonly number[] = ZOOM_PRESETS,
  min: number = ZOOM_MIN,
  max: number = ZOOM_MAX
): number {
  const sorted = [...presets].sort((a, b) => a - b);
  if (direction === "up") {
    const next = sorted.find((p) => p > currentZoom);
    return clampZoom(next ?? max, min, max);
  }
  const reversed = [...sorted].reverse();
  const prev = reversed.find((p) => p < currentZoom);
  return clampZoom(prev ?? min, min, max);
}

type ZoomDropdownMenuProps = {
  currentZoom: ZoomLevel;
  onZoomChange: (zoom: ZoomLevel) => void;
  onFitToPage?: () => void;
  min?: number;
  max?: number;
};

/** Headless zoom control — https://tiptap.dev/docs/ui-components/components/zoom-dropdown-menu */
export function ZoomDropdownMenu({
  currentZoom,
  onZoomChange,
  onFitToPage,
  min = ZOOM_MIN,
  max = ZOOM_MAX,
}: ZoomDropdownMenuProps) {
  const zoom = clampZoom(currentZoom, min, max);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(String(zoom));

  const isMinZoom = zoom <= min;
  const isMaxZoom = zoom >= max;

  const setZoom = useCallback(
    (value: number) => {
      const next = clampZoom(value, min, max);
      onZoomChange(next);
      setInputValue(String(next));
    },
    [max, min, onZoomChange]
  );

  const zoomIn = () => setZoom(getNextPresetZoom(zoom, "up", ZOOM_PRESETS, min, max));
  const zoomOut = () => setZoom(getNextPresetZoom(zoom, "down", ZOOM_PRESETS, min, max));

  const commitInput = () => {
    const parsed = parsePercent(inputValue);
    if (parsed === null) {
      setInputValue(String(zoom));
      return;
    }
    setZoom(parsed);
  };

  return (
    <div className="tiptap-zoom-menu">
      <button
        type="button"
        className="tiptap-toolbar-btn"
        title="Zoom out"
        aria-label="Zoom out"
        disabled={isMinZoom}
        onClick={zoomOut}
      >
        <Minus size={16} strokeWidth={2} />
      </button>
      <div className="relative">
        <button
          type="button"
          className="tiptap-zoom-trigger"
          aria-label="Zoom level"
          aria-expanded={open}
          onClick={() => {
            setInputValue(String(zoom));
            setOpen((v) => !v);
          }}
        >
          {zoom}%
        </button>
        {open ? (
          <div className="tiptap-zoom-popover">
            <div className="flex items-center gap-2 px-3 py-2">
              <input
                className="tiptap-zoom-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={commitInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    commitInput();
                    setOpen(false);
                  } else if (e.key === "Escape") {
                    setInputValue(String(zoom));
                    setOpen(false);
                  }
                }}
                aria-label="Zoom percentage"
              />
              <span className="text-xs text-slate-500">%</span>
            </div>
            <div className="tiptap-zoom-presets">
              {ZOOM_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={preset === zoom ? "is-active" : undefined}
                  onClick={() => {
                    setZoom(preset);
                    setOpen(false);
                  }}
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
        ) : null}
      </div>
      <button
        type="button"
        className="tiptap-toolbar-btn"
        title="Zoom in"
        aria-label="Zoom in"
        disabled={isMaxZoom}
        onClick={zoomIn}
      >
        <Plus size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
