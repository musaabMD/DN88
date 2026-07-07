"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import type { DetailTab, ViewMode } from "@/lib/types";
import type { LearnItem, McqItem, ReviewItem } from "@/lib/types";

interface ContentViewerProps {
  tab: DetailTab;
  viewMode: ViewMode;
  learnItems: LearnItem[];
  mcqItems: McqItem[];
  reviewItems: ReviewItem[];
  search: string;
}

export default function ContentViewer({
  tab,
  viewMode,
  learnItems,
  mcqItems,
  reviewItems,
  search,
}: ContentViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [revealedReviews, setRevealedReviews] = useState<Set<string>>(new Set());

  const q = search.toLowerCase();

  const filteredLearn = learnItems.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q)
  );
  const filteredMcq = mcqItems.filter((item) =>
    item.question.toLowerCase().includes(q)
  );
  const filteredReview = reviewItems.filter(
    (item) =>
      item.prompt.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q)
  );

  const items =
    tab === "learn"
      ? filteredLearn
      : tab === "mcqs"
        ? filteredMcq
        : filteredReview;

  const resetMcqState = () => {
    setSelectedOption(null);
    setShowAnswer(false);
  };

  const goNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((i) => i + 1);
      resetMcqState();
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      resetMcqState();
    }
  };

  if (items.length === 0) {
    return (
      <div className="card-shadow rounded-3xl bg-card p-8 text-center">
        <p className="text-sm font-semibold text-muted">Nothing here yet</p>
      </div>
    );
  }

  if (viewMode === "all") {
    return (
      <div className="flex flex-col gap-3">
        {tab === "learn" &&
          (filteredLearn as LearnItem[]).map((item) => (
            <div key={item.id} className="card-shadow rounded-2xl bg-card p-4">
              <h4 className="mb-1 text-sm font-extrabold">{item.title}</h4>
              <p className="text-sm text-muted">{item.content}</p>
            </div>
          ))}
        {tab === "mcqs" &&
          (filteredMcq as McqItem[]).map((item) => (
            <div key={item.id} className="card-shadow rounded-2xl bg-card p-4">
              <p className="mb-3 text-sm font-extrabold">{item.question}</p>
              <div className="flex flex-col gap-2">
                {item.options.map((opt, i) => (
                  <div
                    key={i}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                      i === item.answer
                        ? "bg-green-100 text-green-700"
                        : "bg-primary-light text-foreground"
                    }`}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          ))}
        {tab === "review" &&
          (filteredReview as ReviewItem[]).map((item) => (
            <div key={item.id} className="card-shadow rounded-2xl bg-card p-4">
              <p className="mb-2 text-sm font-extrabold">{item.prompt}</p>
              <p className="text-sm text-primary font-semibold">{item.answer}</p>
            </div>
          ))}
      </div>
    );
  }

  const item = items[currentIndex];

  return (
    <div>
      <div className="card-shadow rounded-3xl bg-card p-6">
        {tab === "learn" && (
          <>
            <h4 className="mb-3 text-lg font-extrabold">
              {(item as LearnItem).title}
            </h4>
            <p className="text-sm leading-relaxed text-muted">
              {(item as LearnItem).content}
            </p>
          </>
        )}

        {tab === "mcqs" && (
          <>
            <p className="mb-4 text-base font-extrabold">
              {(item as McqItem).question}
            </p>
            <div className="flex flex-col gap-2">
              {(item as McqItem).options.map((opt, i) => {
                const mcq = item as McqItem;
                const isSelected = selectedOption === i;
                const isCorrect = i === mcq.answer;
                let style = "bg-primary-light text-foreground";

                if (showAnswer && isCorrect) style = "bg-green-100 text-green-700";
                else if (showAnswer && isSelected && !isCorrect)
                  style = "bg-red-100 text-red-600";
                else if (isSelected) style = "bg-primary text-white";

                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (!showAnswer) setSelectedOption(i);
                    }}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition ${style}`}
                  >
                    {opt}
                    {showAnswer && isCorrect && <Check className="h-4 w-4" />}
                    {showAnswer && isSelected && !isCorrect && (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                );
              })}
            </div>
            {!showAnswer && selectedOption !== null && (
              <button
                onClick={() => setShowAnswer(true)}
                className="btn-primary mt-4 w-full py-3 text-sm"
              >
                Check
              </button>
            )}
          </>
        )}

        {tab === "review" && (
          <>
            <p className="mb-4 text-base font-extrabold">
              {(item as ReviewItem).prompt}
            </p>
            {revealedReviews.has((item as ReviewItem).id) ? (
              <p className="rounded-2xl bg-primary-light px-4 py-3 text-sm font-semibold text-primary">
                {(item as ReviewItem).answer}
              </p>
            ) : (
              <button
                onClick={() =>
                  setRevealedReviews(
                    (prev) => new Set([...prev, (item as ReviewItem).id])
                  )
                }
                className="btn-secondary w-full py-3 text-sm"
              >
                Reveal
              </button>
            )}
          </>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={goBack}
          disabled={currentIndex === 0}
          className="btn-secondary flex items-center gap-1 px-4 py-2.5 text-sm disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <span className="text-xs font-bold text-muted">
          {currentIndex + 1} / {items.length}
        </span>
        <button
          onClick={goNext}
          disabled={currentIndex === items.length - 1}
          className="btn-primary flex items-center gap-1 px-4 py-2.5 text-sm disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
