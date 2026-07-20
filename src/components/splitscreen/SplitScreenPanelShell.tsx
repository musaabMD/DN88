"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { SS } from "@/components/splitscreen/splitscreen-theme";

type SplitScreenPanelShellProps = {
  title?: string;
  subtitle?: string;
  accent?: string;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
  /** When true, only show the expand control (no title/subtitle). */
  expandOnlyHeader?: boolean;
};

export function SplitScreenPanelShell({
  title,
  subtitle,
  accent = "#1CB0F6",
  toolbar,
  children,
  className,
  expandOnlyHeader = false,
}: SplitScreenPanelShellProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [immersive, setImmersive] = useState(false);

  useEffect(() => {
    const sync = () => setImmersive(document.fullscreenElement === panelRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = panelRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      setImmersive((value) => !value);
    }
  }, []);

  return (
    <div
      ref={panelRef}
      className={`relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-white ${
        immersive ? "fixed inset-0 z-[200] rounded-none border-0 shadow-none" : ""
      }${className ? ` ${className}` : ""}`}
      style={
        immersive
          ? undefined
          : { borderColor: SS.panelBorder, boxShadow: SS.panelShadow }
      }
    >
      {expandOnlyHeader ? (
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-lg border bg-white/95 shadow-sm backdrop-blur-sm transition hover:opacity-90"
          style={{ borderColor: SS.panelBorder, color: SS.sub }}
          title={immersive ? "Exit full screen" : "Full screen"}
          aria-label={immersive ? "Exit full screen" : "Full screen"}
        >
          {immersive ? <Minimize2 size={15} strokeWidth={2.4} /> : <Maximize2 size={15} strokeWidth={2.4} />}
        </button>
      ) : (
        <div
          className="flex shrink-0 items-center gap-2 border-b px-3 py-2.5"
          style={{ borderColor: SS.panelBorder, background: SS.pageBg }}
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white"
            style={{ background: accent }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            {title ? (
              <p className="truncate text-sm font-black tracking-tight" style={{ color: SS.ink }}>
                {title}
              </p>
            ) : null}
            {subtitle ? (
              <p
                className="truncate text-[10px] font-extrabold uppercase tracking-[0.14em]"
                style={{ color: SS.faint }}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
          {toolbar}
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border bg-white shadow-sm transition hover:opacity-90"
            style={{ borderColor: SS.panelBorder, color: SS.sub }}
            title={immersive ? "Exit full screen" : "Full screen"}
            aria-label={immersive ? "Exit full screen" : "Full screen"}
          >
            {immersive ? <Minimize2 size={15} strokeWidth={2.4} /> : <Maximize2 size={15} strokeWidth={2.4} />}
          </button>
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
