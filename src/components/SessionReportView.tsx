"use client";

import { useMemo } from "react";
import {
  X,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  MinusCircle,
  RotateCcw,
  ArrowLeft,
  BookOpen,
  Zap,
  TrendingUp,
} from "lucide-react";

export interface SubjectScore {
  subject: string;
  correct: number;
  total: number;
}

export interface MissedCard {
  id: string;
  prompt: string;
  subject: string;
}

export interface SessionReportViewProps {
  title: string;
  durationSec: number;
  subjects: SubjectScore[];
  missedCards?: MissedCard[];
  streakBest?: number;
  onClose?: () => void;
  onBackToSets?: () => void;
  onRetryMissed?: () => void;
}

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const scoreTone = (pct: number) => {
  if (pct >= 80)
    return {
      text: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      bar: "bg-emerald-500",
      label: "Strong",
    };
  if (pct >= 50)
    return {
      text: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      bar: "bg-amber-500",
      label: "Getting there",
    };
  return {
    text: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    bar: "bg-rose-500",
    label: "Needs review",
  };
};

function StatCard({
  icon,
  label,
  value,
  sub,
  tone = "slate",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "slate" | "green" | "amber" | "rose";
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-50 border-slate-200 text-slate-500",
    green: "bg-emerald-50 border-emerald-200 text-emerald-600",
    amber: "bg-amber-50 border-amber-200 text-amber-600",
    rose: "bg-rose-50 border-rose-200 text-rose-600",
  };
  const valueTones: Record<string, string> = {
    slate: "text-slate-900",
    green: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
        {icon}
        <span>{label}</span>
      </div>
      <div
        className={`mt-1 text-3xl font-extrabold tabular-nums ${valueTones[tone]}`}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 text-xs font-medium opacity-80">{sub}</div>
      )}
    </div>
  );
}

function SubjectRow({ subject, correct, total }: SubjectScore) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const tone = scoreTone(pct);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <BookOpen className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate text-sm font-semibold text-slate-800">
            {subject}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`hidden rounded-full px-2 py-0.5 text-xs font-semibold sm:inline-block ${tone.bg} ${tone.text}`}
          >
            {tone.label}
          </span>
          <span className="text-sm font-bold tabular-nums text-slate-900">
            {correct}/{total}
          </span>
          <span
            className={`w-12 text-right text-sm font-extrabold tabular-nums ${tone.text}`}
          >
            {pct}%
          </span>
        </div>
      </div>
      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${subject} score`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${tone.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function SessionReportView({
  title,
  durationSec,
  subjects,
  missedCards = [],
  streakBest = 0,
  onClose,
  onBackToSets,
  onRetryMissed,
}: SessionReportViewProps) {
  const { totalCorrect, totalCards, overallPct } = useMemo(() => {
    const correct = subjects.reduce((a, s) => a + s.correct, 0);
    const total = subjects.reduce((a, s) => a + s.total, 0);
    return {
      totalCorrect: correct,
      totalCards: total,
      overallPct: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  }, [subjects]);

  const overallTone = scoreTone(overallPct);
  const missed = totalCards - totalCorrect;
  const avgSecPerCard =
    totalCards > 0 ? Math.round(durationSec / totalCards) : 0;

  const overallStatTone: "green" | "amber" | "rose" =
    overallPct >= 80 ? "green" : overallPct >= 50 ? "amber" : "rose";

  const handleBackToSets = onBackToSets ?? onClose;
  const handleClose = onClose ?? onBackToSets;

  return (
    <div className="flex flex-1 flex-col bg-slate-50 font-sans">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Session report
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {title}
            </h1>
          </div>
          {handleClose ? (
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close report"
              className="rounded-xl bg-white p-2.5 text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </header>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<Target className="h-3.5 w-3.5" />}
            label="Overall"
            value={`${overallPct}%`}
            sub={`${totalCorrect} of ${totalCards} correct`}
            tone={overallStatTone}
          />
          <StatCard
            icon={<Clock className="h-3.5 w-3.5" />}
            label="Time"
            value={formatTime(durationSec)}
            sub={`~${avgSecPerCard}s per card`}
          />
          <StatCard
            icon={<XCircle className="h-3.5 w-3.5" />}
            label="Missed"
            value={String(missed)}
            sub={missed === 1 ? "card to review" : "cards to review"}
            tone={missed > 0 ? "rose" : "green"}
          />
          <StatCard
            icon={<Zap className="h-3.5 w-3.5" />}
            label="Best streak"
            value={String(streakBest)}
            sub="in a row"
          />
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Score by subject
            </h2>
            <span
              className={`flex items-center gap-1 text-xs font-semibold ${overallTone.text}`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              {overallTone.label}
            </span>
          </div>
          <div className="mt-3 space-y-2.5">
            {subjects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                No subject data for this session yet. Finish a few cards to see
                your breakdown here.
              </div>
            ) : (
              subjects.map((s) => <SubjectRow key={s.subject} {...s} />)
            )}
          </div>
        </section>

        {missedCards.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Review these next
            </h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {missedCards.map((card, i) => (
                <div
                  key={card.id}
                  className={`flex items-start gap-3 p-4 ${
                    i > 0 ? "border-t border-slate-100" : ""
                  }`}
                >
                  <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {card.prompt}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {card.subject}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {missed === 0 && totalCards > 0 && (
          <section className="mt-8 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-800">
              Perfect run. Every card in this set answered correctly.
            </p>
          </section>
        )}

        <div className="mt-auto pt-10">
          <div className="flex flex-col gap-3 sm:flex-row">
            {missed > 0 && onRetryMissed ? (
              <button
                type="button"
                onClick={onRetryMissed}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-base font-extrabold text-white shadow-sm transition hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <RotateCcw className="h-5 w-5" />
                Retry missed cards
              </button>
            ) : null}
            {handleBackToSets ? (
              <button
                type="button"
                onClick={handleBackToSets}
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                  missed > 0
                    ? "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                    : "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
                }`}
              >
                <ArrowLeft className="h-5 w-5" />
                Back to sets
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
