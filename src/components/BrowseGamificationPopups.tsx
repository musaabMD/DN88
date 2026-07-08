"use client";

import type { ReactNode } from "react";
import { Check, Flame, Heart } from "lucide-react";

export const BROWSE_DAILY_LIMIT = 20;
export const BROWSE_DAILY_USED = 13;
export const BROWSE_STREAK = 14;

function HeaderPopover({
  onClose,
  anchor,
  caretClassName,
  children,
}: {
  onClose: () => void;
  anchor: "streak" | "daily";
  caretClassName: string;
  children: ReactNode;
}) {
  const positionClass =
    anchor === "streak" ? "right-28 md:right-36" : "right-16 md:right-24";

  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/10" />
      <div
        className={`absolute top-24 ${positionClass} w-[280px] max-w-[calc(100vw-1rem)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-[-5px] flex justify-center">
          <div
            className={`h-2.5 w-2.5 rotate-45 border-l border-t ${caretClassName}`}
          />
        </div>
        {children}
      </div>
    </div>
  );
}

export function StatsPopup({
  streak,
  onClose,
}: {
  streak: number;
  onClose: () => void;
}) {
  const weekLabels = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date().getDay();

  return (
    <HeaderPopover
      onClose={onClose}
      anchor="streak"
      caretClassName="border-orange-300 bg-[#ff9600]"
    >
      <div
        className="overflow-hidden rounded-2xl p-4 text-white"
        style={{ background: "#ff9600", boxShadow: "0 8px 24px rgba(255,150,0,0.28)" }}
      >
        <div className="mb-4 flex items-center gap-3">
          <Flame size={28} strokeWidth={2.5} className="shrink-0 text-white" fill="white" />
          <div>
            <p className="text-xl font-extrabold leading-tight">{streak} day streak</p>
            <p className="text-xs font-semibold text-white/90">
              Keep studying daily to maintain it
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-3">
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekLabels.map((label, index) => (
              <span
                key={`${label}-${index}`}
                className="text-[10px] font-bold text-slate-400"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-7 gap-1">
            {weekLabels.map((label, index) => {
              const active = index === today;
              return (
                <div key={`dot-${label}-${index}`} className="flex justify-center">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full"
                    style={{ background: active ? "#ff9600" : "#e5e7eb" }}
                  >
                    {active && (
                      <Check size={14} strokeWidth={3} className="text-white" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </HeaderPopover>
  );
}

export function DailyPopup({
  used,
  limit,
  onUpgrade,
  onClose,
}: {
  used: number;
  limit: number;
  onUpgrade: () => void;
  onClose: () => void;
}) {
  const remaining = limit - used;
  const heartSlots = 5;
  const filledHearts = Math.max(
    0,
    Math.min(heartSlots, Math.ceil(remaining / (limit / heartSlots)))
  );

  return (
    <HeaderPopover
      onClose={onClose}
      anchor="daily"
      caretClassName="border-slate-200 bg-white"
    >
      <div
        className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-4"
        style={{ boxShadow: "0 8px 24px rgba(15,23,42,0.1)" }}
      >
        <p className="mb-3 text-center text-base font-extrabold text-slate-700">
          Daily questions
        </p>

        <div className="mb-3 flex items-center justify-center gap-1.5">
          {Array.from({ length: heartSlots }).map((_, index) => (
            <Heart
              key={index}
              size={22}
              strokeWidth={2}
              className={index < filledHearts ? "text-[#ff4b4b]" : "text-slate-200"}
              fill={index < filledHearts ? "#ff4b4b" : "none"}
            />
          ))}
        </div>

        <p className="mb-1 text-center text-sm font-bold text-slate-700">
          {remaining > 0 ? (
            <>
              <span className="text-[#ff4b4b]">{remaining}</span> left today
            </>
          ) : (
            "Limit reached"
          )}
        </p>
        <p className="mb-4 text-center text-xs font-medium text-slate-400">
          {remaining > 0 ? "You still have questions left." : "Come back tomorrow."}
        </p>

        <button
          type="button"
          onClick={() => {
            onClose();
            onUpgrade();
          }}
          className="mb-2 w-full rounded-xl border-2 border-b-4 border-violet-200 bg-violet-50 py-2.5 text-xs font-extrabold uppercase tracking-wide text-violet-700 active:translate-y-0.5 active:border-b-2"
        >
          Unlimited questions
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-1.5 text-xs font-bold text-slate-400"
        >
          Maybe later
        </button>
      </div>
    </HeaderPopover>
  );
}
