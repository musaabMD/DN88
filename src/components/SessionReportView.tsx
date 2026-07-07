"use client";

import { Clock, Target, X } from "lucide-react";

export function SessionReportView({
  setTitle,
  elapsedSeconds,
  overallScore,
  subjectScores,
  onClose,
}: {
  setTitle: string;
  elapsedSeconds: number;
  overallScore: number;
  subjectScores: Record<string, { correct: number; total: number }>;
  onClose: () => void;
}) {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeLabel = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const scoreStyle =
    overallScore >= 85
      ? { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" }
      : overallScore >= 70
        ? { color: "#b45309", bg: "#fffbeb", border: "#fde68a" }
        : { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" };

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-8">
      <div className="flex items-start justify-between gap-3 mb-8">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
            Session report
          </p>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">
            {setTitle}
          </h1>
        </div>
        <button
          onClick={onClose}
          aria-label="Close report"
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 shrink-0"
        >
          <X size={18} strokeWidth={2.5} className="text-slate-500" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div
          className="rounded-2xl p-4"
          style={{ background: "#f8fafc", border: "2px solid #e2e8f0" }}
        >
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Clock size={14} strokeWidth={2.5} />
            <span className="text-xs font-black uppercase tracking-wide">
              Time
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900">{timeLabel}</p>
        </div>
        <div
          className="rounded-2xl p-4"
          style={{
            background: scoreStyle.bg,
            border: `2px solid ${scoreStyle.border}`,
          }}
        >
          <div
            className="flex items-center gap-1.5 mb-1"
            style={{ color: scoreStyle.color }}
          >
            <Target size={14} strokeWidth={2.5} />
            <span className="text-xs font-black uppercase tracking-wide">
              Overall
            </span>
          </div>
          <p className="text-2xl font-black" style={{ color: scoreStyle.color }}>
            {overallScore}%
          </p>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
          Score by subject
        </p>
        <div className="space-y-2">
          {Object.entries(subjectScores).map(([subject, stats]) => {
            const pct =
              stats.total > 0
                ? Math.round((stats.correct / stats.total) * 100)
                : 0;
            return (
              <div
                key={subject}
                className="flex items-center justify-between rounded-2xl px-4 py-3"
                style={{ background: "#fff", border: "2px solid #e2e8f0" }}
              >
                <span className="text-sm font-bold text-slate-700">
                  {subject}
                </span>
                <span className="text-sm font-black text-slate-900">
                  {pct}%{" "}
                  <span className="text-slate-400 font-semibold">
                    ({stats.correct}/{stats.total})
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full py-4 rounded-2xl font-black text-base text-white mt-auto"
        style={{
          background: "#58CC02",
          border: "2px solid #46A302",
          boxShadow: "0 4px 0 #46A302",
        }}
      >
        Back to sets
      </button>
    </div>
  );
}
