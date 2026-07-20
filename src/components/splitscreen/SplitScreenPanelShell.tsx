"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type SplitScreenPanelShellProps = {
  title: string;
  subtitle?: string;
  accent?: string;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SplitScreenPanelShell({
  title,
  subtitle,
  accent = "#1CB0F6",
  toolbar,
  children,
  className,
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
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)] ${
        immersive ? "fixed inset-0 z-[200] rounded-none border-0 shadow-none" : ""
      }${className ? ` ${className}` : ""}`}
    >
      <div
        className="flex shrink-0 items-center gap-2 border-b border-[#E8ECF0] px-3 py-2.5"
        style={{
          background: `linear-gradient(135deg, ${accent}14 0%, #ffffff 55%, #f8fafc 100%)`,
        }}
      >
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white"
          style={{ background: accent }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black tracking-tight text-[#1F2937]">{title}</p>
          {subtitle ? (
            <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#94A3B8]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {toolbar}
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#E5E7EB] bg-white text-[#64748B] shadow-sm transition hover:border-[#CBD5E1] hover:text-[#334155]"
          title={immersive ? "Exit full screen" : "Full screen"}
          aria-label={immersive ? "Exit full screen" : "Full screen"}
        >
          {immersive ? <Minimize2 size={15} strokeWidth={2.4} /> : <Maximize2 size={15} strokeWidth={2.4} />}
        </button>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
