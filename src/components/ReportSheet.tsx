"use client";

import { useState } from "react";
import { Check, Flag, X } from "lucide-react";
import { REPORT_OPTIONS } from "@/lib/report-options";

export function ReportSheet({
  open,
  onClose,
  options = REPORT_OPTIONS,
}: {
  open: boolean;
  onClose: () => void;
  options?: readonly string[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const toggle = (opt: string) => {
    setSelected((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
    );
  };

  const handleSubmit = () => {
    if (selected.length === 0) return;
    setSubmitted(true);
    window.setTimeout(() => {
      setSubmitted(false);
      setSelected([]);
      onClose();
    }, 900);
  };

  return (
    <>
      <div className="fixed inset-0 z-[65] bg-black/30" onClick={onClose} />
      <div
        className="fixed inset-x-0 bottom-0 z-[66] flex max-h-[85vh] flex-col rounded-t-3xl bg-white"
        style={{ borderTop: "3px solid #e2e8f0" }}
      >
        <div className="flex items-center justify-between px-4 h-14 flex-shrink-0 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Flag size={16} className="text-red-500" strokeWidth={2.5} />
            <span className="font-black text-slate-900 text-sm">Report issue</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100"
          >
            <X size={15} strokeWidth={2.5} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {options.map((opt) => {
            const active = selected.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className="w-full flex items-start gap-3 px-3 py-3 rounded-2xl text-sm font-semibold text-left transition-all"
                style={
                  active
                    ? {
                        background: "#fee2e2",
                        border: "2px solid #fca5a5",
                        color: "#dc2626",
                      }
                    : {
                        background: "#fff",
                        border: "2px solid #e2e8f0",
                        color: "#475569",
                      }
                }
              >
                <div
                  className="w-4 h-4 mt-0.5 rounded-md flex-shrink-0 flex items-center justify-center"
                  style={{ background: active ? "#dc2626" : "#e2e8f0" }}
                >
                  {active && (
                    <Check size={10} strokeWidth={3} className="text-white" />
                  )}
                </div>
                {opt}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleSubmit}
            disabled={selected.length === 0 || submitted}
            className="w-full py-3 rounded-2xl font-black text-sm text-white disabled:opacity-40"
            style={{
              background: submitted ? "#22c55e" : "#ef4444",
              border: `2px solid ${submitted ? "#16a34a" : "#dc2626"}`,
            }}
          >
            {submitted ? "Report submitted" : "Submit report"}
          </button>
        </div>
      </div>
    </>
  );
}
