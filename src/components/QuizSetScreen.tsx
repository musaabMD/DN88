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
  X,
  ArrowLeft,
} from "lucide-react";
import type { QuizSetScreenData } from "@/lib/mock-data";
import {
  quizPath,
  resultsPath,
  tabPath,
  type ContentTab,
} from "@/lib/routes";

const C = {
  green: "#58CC02",
  greenDark: "#46A302",
  blue: "#1CB0F6",
  red: "#FF4B4B",
  yellow: "#FFC800",
  purple: "#CE82FF",
  orange: "#FF9600",
  border: "#E5E5E5",
  text: "#4B4B4B",
  sub: "#AFAFAF",
};

function progressBarColor(pct: number): string {
  if (pct >= 85) return C.green;
  if (pct >= 60) return C.yellow;
  return C.red;
}

function Tile({
  icon: Icon,
  color,
  title,
  badge,
  onClick,
}: {
  icon: React.ElementType;
  color: string;
  title: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-white px-3 py-5 transition-all hover:bg-[#F7F7F7] active:translate-y-[3px] active:border-b-2"
    >
      {badge && (
        <span
          className="absolute right-2.5 top-2.5 min-w-[22px] rounded-full px-1.5 py-0.5 text-center text-xs font-extrabold text-white"
          style={{ backgroundColor: color }}
        >
          {badge}
        </span>
      )}
      <Icon className="h-7 w-7" strokeWidth={2.5} style={{ color }} />
      <span className="text-[13px] font-extrabold uppercase tracking-wide text-[#4B4B4B] text-center leading-tight">
        {title}
      </span>
    </button>
  );
}

function BigButton({
  label,
  icon: Icon,
  color,
  edge,
  onClick,
  disabled,
}: {
  label: string;
  icon?: React.ElementType;
  color: string;
  edge: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ backgroundColor: color, borderColor: edge }}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border-b-4 px-5 py-4 text-[15px] font-extrabold uppercase tracking-wider text-white transition-all active:translate-y-[3px] active:border-b-0 disabled:opacity-40 disabled:pointer-events-none"
    >
      {Icon && <Icon className="h-5 w-5" strokeWidth={2.5} />}
      {label}
    </button>
  );
}

function Slider({
  value,
  min,
  max,
  step = 1,
  color,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  color: string;
  onChange: (v: number) => void;
}) {
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

  return (
    <div className="flex w-full select-none items-center gap-3">
      <span className="w-7 text-right text-sm font-extrabold text-[#AFAFAF]">
        {min}
      </span>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          setFromClientX(e.clientX);
        }}
        onPointerMove={(e) => e.buttons === 1 && setFromClientX(e.clientX)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp")
            onChange(Math.min(max, value + step));
          if (e.key === "ArrowLeft" || e.key === "ArrowDown")
            onChange(Math.max(min, value - step));
        }}
        className="relative flex h-10 flex-1 cursor-pointer touch-none items-center focus:outline-none"
      >
        <div className="h-4 w-full rounded-full bg-[#E5E5E5]" />
        <div
          className="absolute h-4 rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
        <div
          className="absolute h-7 w-7 -translate-x-1/2 rounded-full border-4 bg-white shadow-md"
          style={{ left: `${pct}%`, borderColor: color }}
        />
      </div>
      <span className="w-7 text-sm font-extrabold text-[#AFAFAF]">{max}</span>
    </div>
  );
}

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full rounded-t-[28px] bg-white p-6 pb-8 sm:max-w-md sm:rounded-[28px] sm:pb-6">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-b-4 border-[#E5E5E5] text-[#AFAFAF] transition-all active:translate-y-[2px] active:border-b-2"
        >
          <X className="h-4 w-4" strokeWidth={3} />
        </button>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({
  icon: Icon,
  color,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  color: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6 flex flex-col items-center text-center">
      <Icon className="mb-3 h-10 w-10" strokeWidth={2.5} style={{ color }} />
      <h2 className="text-xl font-extrabold text-[#4B4B4B]">{title}</h2>
      <p className="mt-1 text-sm font-bold text-[#AFAFAF]">{subtitle}</p>
    </div>
  );
}

function BigValue({ value, suffix }: { value: number; suffix: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-center gap-1.5">
      <span className="text-5xl font-extrabold tabular-nums text-[#4B4B4B]">
        {value}
      </span>
      <span className="text-sm font-extrabold uppercase tracking-wide text-[#AFAFAF]">
        {suffix}
      </span>
    </div>
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
  const [flaggedCount, setFlaggedCount] = useState(
    Math.min(1, data.flaggedCount)
  );
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

  const progressColor = progressBarColor(data.progress);
  const bestColor = progressBarColor(data.best);

  return (
    <div className="min-h-screen bg-white text-[#4B4B4B] antialiased">
      <div className="mx-auto max-w-md px-5 py-6">
        <button
          onClick={() => router.push(tabPath(tab))}
          className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-b-4 border-[#E5E5E5] text-[#AFAFAF] transition-all hover:bg-[#F7F7F7] active:translate-y-[2px] active:border-b-2"
          aria-label="Back to sets"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
        </button>

        <div className="rounded-2xl border-2 border-b-4 border-[#E5E5E5] bg-white p-4">
          <div className="flex items-center justify-between text-[13px] font-extrabold uppercase tracking-wide">
            <span className="text-[#AFAFAF]">{data.items} questions</span>
            <span>
              <span style={{ color: progressColor }}>{data.progress}%</span>
              <span className="text-[#AFAFAF]"> · best </span>
              <span style={{ color: bestColor }}>{data.best}%</span>
            </span>
          </div>
          <div className="mt-2 h-4 w-full overflow-hidden rounded-full border-2 border-[#E5E5E5] bg-[#E5E5E5]">
            <div
              className="h-full rounded-full"
              style={{ width: `${data.progress}%`, backgroundColor: progressColor }}
            />
          </div>
        </div>

        <div className="mt-6">
          <BigButton
            label="Resume"
            icon={Play}
            color={C.green}
            edge={C.greenDark}
            onClick={() => goQuiz({ mode: "resume" })}
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Tile
            icon={Zap}
            color={C.yellow}
            title="Quick 10"
            onClick={() => goQuiz({ mode: "quick", count: 10 })}
          />
          <Tile
            icon={Timer}
            color={C.blue}
            title="Timed quiz"
            onClick={() => setModal("timed")}
          />
          <Tile
            icon={XCircle}
            color={C.red}
            title="Incorrect"
            badge={String(data.incorrectCount)}
            onClick={() => setModal("incorrect")}
          />
          <Tile
            icon={Bookmark}
            color={C.purple}
            title="Flagged"
            badge={String(data.flaggedCount)}
            onClick={() => setModal("flagged")}
          />
          <Tile
            icon={GraduationCap}
            color={C.orange}
            title="Mock exam"
            onClick={() => setModal("mock")}
          />
          <Tile
            icon={RotateCcw}
            color={C.blue}
            title="Start over"
            onClick={() => goQuiz({ mode: "restart" })}
          />
          <Tile
            icon={BarChart3}
            color={C.green}
            title="Results"
            onClick={() => router.push(resultsPath(tab, setId))}
          />
          <Tile
            icon={Share2}
            color={C.purple}
            title="Share"
            onClick={shareSet}
          />
        </div>

        <button
          onClick={onReport}
          className="mx-auto mt-6 flex items-center gap-1.5 text-[13px] font-extrabold uppercase tracking-wide text-[#AFAFAF] transition-colors hover:text-[#FF4B4B]"
        >
          <Flag className="h-4 w-4" strokeWidth={2.5} />
          Report a problem
        </button>
      </div>

      <Modal open={modal === "timed"} onClose={() => setModal(null)}>
        <ModalHeader
          icon={Timer}
          color={C.blue}
          title="Timed quiz"
          subtitle="How many minutes?"
        />
        <BigValue value={timedMinutes} suffix="min" />
        <Slider
          value={timedMinutes}
          min={1}
          max={100}
          color={C.blue}
          onChange={setTimedMinutes}
        />
        <div className="mt-6">
          <BigButton
            label="Start quiz"
            color={C.blue}
            edge="#1899D6"
            onClick={() => goQuiz({ mode: "timed", minutes: timedMinutes })}
          />
        </div>
      </Modal>

      <Modal open={modal === "incorrect"} onClose={() => setModal(null)}>
        <ModalHeader
          icon={XCircle}
          color={C.red}
          title="Incorrect"
          subtitle={`${data.incorrectCount} missed questions`}
        />
        <BigValue value={incorrectCount} suffix="questions" />
        <Slider
          value={incorrectCount}
          min={0}
          max={data.incorrectCount}
          color={C.red}
          onChange={setIncorrectCount}
        />
        <div className="mt-6">
          <BigButton
            label="Start review"
            color={C.red}
            edge="#EA2B2B"
            disabled={incorrectCount === 0}
            onClick={() => goQuiz({ mode: "incorrect", count: incorrectCount })}
          />
        </div>
      </Modal>

      <Modal open={modal === "flagged"} onClose={() => setModal(null)}>
        <ModalHeader
          icon={Bookmark}
          color={C.purple}
          title="Flagged"
          subtitle={`${data.flaggedCount} flagged questions`}
        />
        <BigValue value={flaggedCount} suffix="questions" />
        <Slider
          value={flaggedCount}
          min={0}
          max={data.flaggedCount}
          color={C.purple}
          onChange={setFlaggedCount}
        />
        <div className="mt-6">
          <BigButton
            label="Start review"
            color={C.purple}
            edge="#A855F7"
            disabled={flaggedCount === 0}
            onClick={() => goQuiz({ mode: "flagged", count: flaggedCount })}
          />
        </div>
      </Modal>

      <Modal open={modal === "mock"} onClose={() => setModal(null)}>
        <ModalHeader
          icon={GraduationCap}
          color={C.orange}
          title="Mock exam"
          subtitle="No hints, graded at the end"
        />
        <BigValue value={mockQuestions} suffix="questions" />
        <Slider
          value={mockQuestions}
          min={5}
          max={100}
          step={5}
          color={C.orange}
          onChange={setMockQuestions}
        />
        <p className="mt-3 text-center text-[13px] font-extrabold uppercase tracking-wide text-[#AFAFAF]">
          Suggested time · {Math.round(mockQuestions * 1.2)} min
        </p>
        <div className="mt-6">
          <BigButton
            label="Begin exam"
            color={C.orange}
            edge="#E08600"
            onClick={() => goQuiz({ mode: "mock", count: mockQuestions })}
          />
        </div>
      </Modal>
    </div>
  );
}
