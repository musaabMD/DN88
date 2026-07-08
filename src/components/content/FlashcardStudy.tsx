"use client";

import { useState } from "react";
import { RotateCcw, X, Zap } from "lucide-react";
import type { FlashcardItem } from "@/lib/set-content";

const GRADES = [
  { label: "Again", interval: "1m", style: "border-slate-200 text-slate-500 hover:bg-slate-50", result: "incorrect" as const },
  { label: "Hard", interval: "10m", style: "border-amber-200 text-amber-600 hover:bg-amber-50", result: "incorrect" as const },
  { label: "Good", interval: "1d", style: "border-slate-300 text-slate-700 hover:bg-slate-50", result: "correct" as const },
  { label: "Easy", interval: "4d", style: "border-sky-200 text-sky-600 hover:bg-sky-50", result: "correct" as const },
];

export default function FlashcardStudy({
  cards,
  onClose,
}: {
  cards: FlashcardItem[];
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const card = cards[index];
  if (!card) return null;

  const grade = (result: "correct" | "incorrect") => {
    if (result === "correct") setCorrectCount((c) => c + 1);
    setRevealed(false);
    if (index + 1 >= cards.length) {
      onClose();
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-white"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="flex h-14 shrink-0 items-center justify-between px-4 sm:px-6">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Back to deck"
        >
          <X size={22} strokeWidth={3} />
        </button>
        <p className="text-xs font-extrabold tabular-nums text-slate-400">
          {index + 1} / {cards.length} · {correctCount} correct
        </p>
        <div className="w-10" aria-hidden />
      </div>

      <div className="shrink-0 px-4 sm:px-6">
        <p className="flex items-center justify-center gap-1.5 text-sm font-extrabold text-slate-700">
          <Zap size={15} strokeWidth={3} className="text-amber-600" />
          {card.deck}
        </p>
        <div className="mx-auto mt-3 h-2 w-full max-w-lg overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-slate-600 transition-all duration-300"
            style={{ width: `${((index + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-8 text-center sm:px-12">
        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-300">
          {revealed ? "Answer" : "Question"}
        </p>
        <p className="mt-4 max-w-2xl text-xl font-extrabold leading-relaxed text-slate-800 sm:text-2xl">
          {card.front}
        </p>

        {revealed && (
          <>
            <div className="mx-auto mt-8 h-1 w-16 rounded-full bg-slate-300" />
            <p className="mt-8 max-w-2xl text-lg font-bold leading-relaxed text-slate-600 sm:text-xl">
              {card.back}
            </p>
          </>
        )}
      </div>

      <div
        className="shrink-0 px-4 pb-6 sm:px-6"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {!revealed ? (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="mx-auto block w-full max-w-lg rounded-2xl border-b-4 border-slate-900 bg-slate-800 py-4 text-base font-extrabold text-white transition-colors hover:bg-slate-700 active:translate-y-0.5 active:border-b-2"
          >
            Show answer
          </button>
        ) : (
          <div className="mx-auto grid max-w-lg grid-cols-4 gap-2 sm:gap-3">
            {GRADES.map((g) => (
              <button
                key={g.label}
                type="button"
                onClick={() => grade(g.result)}
                className={`flex flex-col items-center rounded-2xl border-2 border-b-4 bg-white py-3 transition-colors active:translate-y-0.5 active:border-b-2 ${g.style}`}
              >
                <span className="text-sm font-extrabold">{g.label}</span>
                <span className="text-xs font-bold opacity-60">{g.interval}</span>
              </button>
            ))}
          </div>
        )}

        {revealed ? (
          <button
            type="button"
            onClick={() => setRevealed(false)}
            className="mx-auto mt-4 flex items-center gap-1.5 text-xs font-extrabold text-slate-300 transition-colors hover:text-slate-500"
          >
            <RotateCcw size={13} strokeWidth={3} />
            Flip back
          </button>
        ) : null}
      </div>
    </div>
  );
}
