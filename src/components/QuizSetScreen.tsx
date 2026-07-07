"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  RotateCcw,
  BarChart3,
  Share2,
  Flag,
  Timer,
  XCircle,
  Bookmark,
  GraduationCap,
  Zap,
  ChevronRight,
  ChevronLeft,
  X,
  FileQuestion,
  History,
} from "lucide-react";
import type { QuizSetScreenData } from "@/lib/mock-data";
import {
  quizPath,
  resultsPath,
  tabPath,
  type ContentTab,
} from "@/lib/routes";

type SliderProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
};

function Slider({ value, min, max, step = 1, onChange }: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;

  const setFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const raw = min + ratio * (max - min);
      const snapped = Math.round(raw / step) * step;
      onChange(Math.min(max, Math.max(min, snapped)));
    },
    [min, max, step, onChange]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 1) setFromClientX(e.clientX);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp")
      onChange(Math.min(max, value + step));
    if (e.key === "ArrowLeft" || e.key === "ArrowDown")
      onChange(Math.max(min, value - step));
  };

  return (
    <div className="flex items-center gap-3 w-full select-none">
      <span className="text-xs font-medium text-slate-400 w-6 text-right">{min}</span>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
        className="relative flex-1 h-8 flex items-center cursor-pointer touch-none focus:outline-none group"
      >
        <div className="w-full h-1.5 rounded-full bg-slate-200" />
        <div
          className="absolute h-1.5 rounded-full bg-indigo-600"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute w-5 h-5 rounded-full bg-white border-2 border-indigo-600 shadow-sm -translate-x-1/2 transition-transform group-focus:ring-4 group-focus:ring-indigo-100"
          style={{ left: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-slate-400 w-6">{max}</span>
    </div>
  );
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-slate-100 p-6 pb-8 sm:pb-6 animate-in">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({
  icon: Icon,
  tint,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  tint: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center text-center mb-6">
      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-3 ${tint}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
    </div>
  );
}

function ValueBadge({ value, suffix }: { value: number; suffix: string }) {
  return (
    <div className="flex items-baseline justify-center gap-1.5 mb-4">
      <span className="text-4xl font-bold text-slate-900 tabular-nums">{value}</span>
      <span className="text-sm font-medium text-slate-400">{suffix}</span>
    </div>
  );
}

function PrimaryModalButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full mt-6 h-12 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 active:scale-[0.99] transition disabled:opacity-40 disabled:pointer-events-none"
    >
      {label}
    </button>
  );
}

function ModeCard({
  icon: Icon,
  bg,
  fg,
  title,
  badge,
  onClick,
}: {
  icon: React.ElementType;
  bg: string;
  fg: string;
  title: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col justify-between gap-6 rounded-2xl p-4 text-left hover:brightness-[0.98] active:scale-[0.99] transition ${bg}`}
    >
      <div className="flex w-full items-start justify-between">
        <Icon className={`h-6 w-6 ${fg}`} strokeWidth={1.75} />
        {badge && (
          <span
            className={`rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold tabular-nums ${fg}`}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="flex w-full items-center justify-between">
        <span className={`text-sm font-semibold ${fg}`}>{title}</span>
        <span className="h-8 w-8 rounded-full bg-white/70 flex items-center justify-center group-hover:translate-x-0.5 transition">
          <ChevronRight className={`h-4 w-4 ${fg}`} strokeWidth={2} />
        </span>
      </div>
    </button>
  );
}

type ModalKind = null | "timed" | "incorrect" | "flagged" | "mock";

export type QuizSetScreenProps = {
  tab: ContentTab;
  setId: string;
  data: QuizSetScreenData;
  onReport?: () => void;
};

export function QuizSetScreen({ tab, setId, data, onReport }: QuizSetScreenProps) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalKind>(null);
  const [timedMinutes, setTimedMinutes] = useState(5);
  const [incorrectCount, setIncorrectCount] = useState(
    Math.min(1, data.incorrectCount)
  );
  const [flaggedCount, setFlaggedCount] = useState(Math.min(1, data.flaggedCount));
  const [mockQuestions, setMockQuestions] = useState(20);

  const goQuiz = (params?: Parameters<typeof quizPath>[2]) => {
    setModal(null);
    router.push(quizPath(tab, setId, params));
  };

  const shareSet = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      void navigator.share({ title: data.title });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      <div className="mx-auto max-w-md px-5 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push(tabPath(tab))}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Sets
          </button>
          <button
            onClick={onReport}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-rose-600 transition-colors"
          >
            <Flag className="h-4 w-4" />
            Report
          </button>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-2xl bg-indigo-50 ring-1 ring-indigo-100 flex items-center justify-center mb-4">
            <FileQuestion className="h-8 w-8 text-indigo-600" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-indigo-500 mb-1">
            {data.category}
          </span>
          <h1 className="text-2xl font-bold leading-tight text-balance">{data.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{data.items} questions</p>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-slate-600">Progress</span>
            <span className="font-semibold text-emerald-600 tabular-nums">
              {data.progress}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${data.progress}%` }}
            />
          </div>
          <div className="mt-4 flex items-center justify-between text-sm border-t border-slate-100 pt-4">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <BarChart3 className="h-4 w-4 text-slate-400" />
              Best score
            </span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {data.best}%
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => goQuiz({ mode: "resume" })}
            className="col-span-2 h-13 flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-white font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.99] transition"
          >
            <Play className="h-5 w-5 fill-current" />
            Resume · {data.progress}%
          </button>
          <button
            onClick={() => goQuiz({ mode: "restart" })}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99] transition"
          >
            <RotateCcw className="h-4 w-4" />
            Start over
          </button>
          <button
            onClick={() => router.push(resultsPath(tab, setId))}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99] transition"
          >
            <History className="h-4 w-4" />
            Results
          </button>
        </div>

        <div className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 px-1">
            Study modes
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <ModeCard
              icon={Zap}
              bg="bg-amber-50"
              fg="text-amber-700"
              title="Quick 10"
              onClick={() => goQuiz({ mode: "quick", count: 10 })}
            />
            <ModeCard
              icon={Timer}
              bg="bg-sky-50"
              fg="text-sky-700"
              title="Timed quiz"
              onClick={() => setModal("timed")}
            />
            <ModeCard
              icon={XCircle}
              bg="bg-rose-50"
              fg="text-rose-700"
              title="Review incorrect"
              badge={String(data.incorrectCount)}
              onClick={() => setModal("incorrect")}
            />
            <ModeCard
              icon={Bookmark}
              bg="bg-violet-50"
              fg="text-violet-700"
              title="Review flagged"
              badge={String(data.flaggedCount)}
              onClick={() => setModal("flagged")}
            />
            <ModeCard
              icon={GraduationCap}
              bg="bg-emerald-50"
              fg="text-emerald-700"
              title="Mock exam"
              onClick={() => setModal("mock")}
            />
            <ModeCard
              icon={Share2}
              bg="bg-indigo-50"
              fg="text-indigo-700"
              title="Share set"
              onClick={shareSet}
            />
          </div>
        </div>
      </div>

      <Modal open={modal === "timed"} onClose={() => setModal(null)}>
        <ModalHeader
          icon={Timer}
          tint="bg-sky-50 text-sky-600"
          title="Timed quiz"
          subtitle="How many minutes?"
        />
        <ValueBadge value={timedMinutes} suffix="min" />
        <Slider value={timedMinutes} min={1} max={100} onChange={setTimedMinutes} />
        <PrimaryModalButton
          label={`Start ${timedMinutes}-minute quiz`}
          onClick={() => goQuiz({ mode: "timed", minutes: timedMinutes })}
        />
      </Modal>

      <Modal open={modal === "incorrect"} onClose={() => setModal(null)}>
        <ModalHeader
          icon={XCircle}
          tint="bg-rose-50 text-rose-600"
          title="Review incorrect"
          subtitle={`You have ${data.incorrectCount} missed questions`}
        />
        <ValueBadge value={incorrectCount} suffix="questions" />
        <Slider
          value={incorrectCount}
          min={0}
          max={data.incorrectCount}
          onChange={setIncorrectCount}
        />
        <PrimaryModalButton
          label="Start review"
          disabled={incorrectCount === 0}
          onClick={() => goQuiz({ mode: "incorrect", count: incorrectCount })}
        />
      </Modal>

      <Modal open={modal === "flagged"} onClose={() => setModal(null)}>
        <ModalHeader
          icon={Bookmark}
          tint="bg-violet-50 text-violet-600"
          title="Review flagged"
          subtitle={`You flagged ${data.flaggedCount} questions`}
        />
        <ValueBadge value={flaggedCount} suffix="questions" />
        <Slider
          value={flaggedCount}
          min={0}
          max={data.flaggedCount}
          onChange={setFlaggedCount}
        />
        <PrimaryModalButton
          label="Start review"
          disabled={flaggedCount === 0}
          onClick={() => goQuiz({ mode: "flagged", count: flaggedCount })}
        />
      </Modal>

      <Modal open={modal === "mock"} onClose={() => setModal(null)}>
        <ModalHeader
          icon={GraduationCap}
          tint="bg-emerald-50 text-emerald-600"
          title="Mock exam"
          subtitle="No hints, no pausing — graded at the end"
        />
        <ValueBadge value={mockQuestions} suffix="questions" />
        <Slider
          value={mockQuestions}
          min={5}
          max={100}
          step={5}
          onChange={setMockQuestions}
        />
        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-slate-600">
            <Timer className="h-4 w-4 text-slate-400" />
            Suggested time
          </span>
          <span className="font-semibold text-slate-900 tabular-nums">
            {Math.round(mockQuestions * 1.2)} min
          </span>
        </div>
        <PrimaryModalButton
          label="Begin exam"
          onClick={() => goQuiz({ mode: "mock", count: mockQuestions })}
        />
      </Modal>
    </div>
  );
}
