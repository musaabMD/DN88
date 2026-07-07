"use client";

import { Pause } from "lucide-react";

export function SessionPauseModal({
  open,
  remaining,
  onResume,
  onSaveLater,
  onEnd,
}: {
  open: boolean;
  remaining: number;
  onResume: () => void;
  onSaveLater: () => void;
  onEnd: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/40" onClick={onResume} />
      <div
        className="fixed left-1/2 top-1/2 z-[81] w-[min(92vw,380px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-xl"
        style={{ border: "2px solid #e2e8f0" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Pause size={18} className="text-slate-600" strokeWidth={2.5} />
          <h2 className="text-lg font-black text-slate-900">Pause session</h2>
        </div>
        <p className="text-sm font-medium text-slate-600 mb-6 leading-relaxed">
          <span className="font-black text-slate-900">{remaining}</span> question
          {remaining !== 1 ? "s" : ""} remaining. Save your progress and resume
          later, or end now to see your results.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onSaveLater}
            className="w-full py-3 rounded-2xl font-black text-sm text-white"
            style={{
              background: "#58CC02",
              border: "2px solid #46A302",
              boxShadow: "0 3px 0 #46A302",
            }}
          >
            Save & resume later
          </button>
          <button
            onClick={onEnd}
            className="w-full py-3 rounded-2xl font-black text-sm text-slate-700 border-2 border-slate-200 bg-white"
          >
            End session
          </button>
          <button
            onClick={onResume}
            className="w-full py-2.5 rounded-2xl font-bold text-sm text-slate-400"
          >
            Keep studying
          </button>
        </div>
      </div>
    </>
  );
}
