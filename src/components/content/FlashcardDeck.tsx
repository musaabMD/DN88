"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Play,
  XCircle,
  Zap,
} from "lucide-react";
import type { FlashcardItem, StudySet } from "@/lib/set-content";

export type CardReviewFilter = "all" | "correct" | "incorrect" | "new";

function filterCards(
  cards: FlashcardItem[],
  filter: CardReviewFilter
): FlashcardItem[] {
  if (filter === "all") return cards;
  return cards.filter((c) => {
    const status = c.status ?? "new";
    if (filter === "correct") return status === "correct";
    if (filter === "incorrect") return status === "incorrect";
    return status === "new";
  });
}

export default function FlashcardDeck({
  set,
  cards,
  onStart,
}: {
  set: StudySet;
  cards: FlashcardItem[];
  onStart: (filter: CardReviewFilter, deckCards: FlashcardItem[]) => void;
}) {
  const [filter, setFilter] = useState<CardReviewFilter>("all");

  const counts = useMemo(() => {
    const correct = cards.filter((c) => c.status === "correct").length;
    const incorrect = cards.filter((c) => c.status === "incorrect").length;
    const fresh = cards.filter((c) => (c.status ?? "new") === "new").length;
    return { correct, incorrect, fresh, total: cards.length };
  }, [cards]);

  const filtered = useMemo(() => filterCards(cards, filter), [cards, filter]);
  const score = set.score ?? 0;
  const progress = set.total > 0 ? Math.round((set.done / set.total) * 100) : 0;

  const filters: Array<{ id: CardReviewFilter; label: string; count: number }> = [
    { id: "all", label: "All", count: counts.total },
    { id: "correct", label: "Correct", count: counts.correct },
    { id: "incorrect", label: "Incorrect", count: counts.incorrect },
    { id: "new", label: "New", count: counts.fresh },
  ];

  return (
    <div className="relative pb-24">
      <div className="rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Zap size={18} strokeWidth={3} className="text-green-500" />
          <h1 className="text-lg font-extrabold text-slate-800">{set.title}</h1>
        </div>
        <p className="mt-1 text-sm font-bold text-slate-400">{set.subject}</p>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-xl font-black tabular-nums text-slate-800">{score}%</p>
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
              Score
            </p>
          </div>
          <div className="rounded-xl bg-green-50 px-3 py-2">
            <p className="text-xl font-black tabular-nums text-green-600">
              {counts.correct}
            </p>
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-green-600">
              Correct
            </p>
          </div>
          <div className="rounded-xl bg-rose-50 px-3 py-2">
            <p className="text-xl font-black tabular-nums text-rose-500">
              {counts.incorrect}
            </p>
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-rose-500">
              Incorrect
            </p>
          </div>
        </div>

        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs font-bold text-slate-400">
          {set.done} / {set.total} studied
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full border-2 px-3 py-1 text-xs font-extrabold transition-colors ${
              filter === f.id
                ? "border-green-500 bg-green-500 text-white"
                : "border-slate-200 text-slate-500 hover:border-green-500 hover:text-green-600"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm font-bold text-slate-400">
            No cards in this filter.
          </p>
        ) : (
          filtered.map((card, i) => (
            <div
              key={card.id}
              className="flex items-start gap-3 rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-4"
            >
              <span className="mt-0.5 shrink-0 text-slate-300">
                {card.status === "correct" ? (
                  <CheckCircle2 size={18} className="text-green-500" strokeWidth={2.5} />
                ) : card.status === "incorrect" ? (
                  <XCircle size={18} className="text-rose-500" strokeWidth={2.5} />
                ) : (
                  <Circle size={18} strokeWidth={2.5} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-300">
                  Card {i + 1}
                </p>
                <p className="mt-1 text-sm font-bold leading-relaxed text-slate-700">
                  {card.front}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        disabled={filtered.length === 0}
        onClick={() => onStart(filter, filtered)}
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px)+1rem)] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-2xl border-b-4 border-green-600 bg-green-500 px-8 py-3.5 text-base font-extrabold text-white shadow-lg transition-colors hover:bg-green-400 active:translate-y-0.5 active:border-b-2 disabled:opacity-40 md:bottom-8"
      >
        <Play size={18} strokeWidth={3} fill="white" />
        Start
      </button>
    </div>
  );
}
