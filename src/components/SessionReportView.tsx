"use client";

import { Clock, Target, X } from "lucide-react";

function scoreStyle(score: number) {
  if (score >= 70)
    return { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", bar: "#22c55e" };
  if (score >= 55)
    return { color: "#b45309", bg: "#fffbeb", border: "#fde68a", bar: "#f59e0b" };
  return { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", bar: "#ef4444" };
}

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
  const overallStyle = scoreStyle(overallScore);

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
            background: overallStyle.bg,
            border: `2px solid ${overallStyle.border}`,
          }}
        >
          <div
            className="flex items-center gap-1.5 mb-1"
            style={{ color: overallStyle.color }}
          >
            <Target size={14} strokeWidth={2.5} />
            <span className="text-xs font-black uppercase tracking-wide">
              Overall
            </span>
          </div>
          <p className="text-2xl font-black" style={{ color: overallStyle.color }}>
            {overallScore}%
          </p>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
          Score by subject
        </p>
        <div className="space-y-3">
          {Object.entries(subjectScores).map(([subject, stats]) => {
            const pct =
              stats.total > 0
                ? Math.round((stats.correct / stats.total) * 100)
                : 0;
            const style = scoreStyle(pct);

            return (
              <div
                key={subject}
                className="rounded-2xl bg-white px-4 py-4"
                style={{ border: "1.5px solid #e2e8f0", boxShadow: "0 1px 0 #e2e8f0" }}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <p className="text-sm font-black leading-snug text-slate-900">
                    {subject}
                  </p>
                  <p
                    className="text-xl font-black tabular-nums leading-none"
                    style={{ color: style.color }}
                  >
                    {pct}%
                  </p>
                </div>
                <p className="mb-3 text-xs font-semibold text-slate-500">
                  {stats.correct} of {stats.total} correct
                </p>
                <div
                  className="h-2 overflow-hidden rounded-full"
                  style={{ background: "#f1f5f9" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: style.bar }}
                  />
                </div>
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
