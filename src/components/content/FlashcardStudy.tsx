"use client";

import { useState } from "react";
import { RotateCcw, X, Zap } from "lucide-react";
import type { FlashcardItem } from "@/lib/set-content";

const GRADES = [
  { label: "Again", interval: "1m", style: "border-slate-200 text-slate-500 hover:bg-slate-50", result: "incorrect" as const },
  { label: "Hard", interval: "10m", style: "border-amber-200 text-amber-600 hover:bg-amber-50", result: "incorrect" as const },
  { label: "Good", interval: "1d", style: "border-green-200 text-green-600 hover:bg-green-50", result: "correct" as const },
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
    <div className="pb-8">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-b-4 border-slate-200 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 active:translate-y-0.5 active:border-b-2"
          aria-label="Back to deck"
        >
          <X size={20} strokeWidth={3} />
        </button>
        <p className="text-xs font-extrabold tabular-nums text-slate-400">
          {index + 1} / {cards.length} · {correctCount} correct
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-extrabold text-slate-700">
          <Zap size={15} strokeWidth={3} className="text-green-500" />
          {card.deck}
        </p>
      </div>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-300"
          style={{ width: `${((index + 1) / cards.length) * 100}%` }}
        />
      </div>

      <div className="mt-5 flex min-h-64 flex-col justify-center rounded-3xl border-2 border-b-4 border-slate-200 bg-white p-6 text-center sm:p-10">
        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-300">
          {revealed ? "Answer" : "Question"}
        </p>
        <p className="mt-3 text-lg font-extrabold leading-relaxed text-slate-700 sm:text-xl">
          {card.front}
        </p>

        {revealed && (
          <>
            <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-green-500" />
            <p className="mt-5 text-base font-bold leading-relaxed text-green-700 sm:text-lg">
              {card.back}
            </p>
          </>
        )}
      </div>

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-5 w-full rounded-2xl border-b-4 border-green-600 bg-green-500 py-3.5 text-base font-extrabold text-white transition-colors hover:bg-green-400 active:translate-y-0.5 active:border-b-2"
        >
          Show answer
        </button>
      ) : (
        <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-3">
          {GRADES.map((g) => (
            <button
              key={g.label}
              type="button"
              onClick={() => grade(g.result)}
              className={`flex flex-col items-center rounded-2xl border-2 border-b-4 bg-white py-2.5 transition-colors active:translate-y-0.5 active:border-b-2 ${g.style}`}
            >
              <span className="text-sm font-extrabold">{g.label}</span>
              <span className="text-xs font-bold opacity-60">{g.interval}</span>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setRevealed(false)}
        className="mx-auto mt-4 flex items-center gap-1.5 text-xs font-extrabold text-slate-300 transition-colors hover:text-slate-500"
      >
        <RotateCcw size={13} strokeWidth={3} />
        Flip back
      </button>
    </div>
  );
}
