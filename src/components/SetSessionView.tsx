"use client";

import { useState, type ReactNode } from "react";
import {
  createInitialChat,
  QuestionChatPanel,
  type ChatMessage,
} from "@/components/QuestionChatPanel";
import { ReportSheet } from "@/components/ReportSheet";
import { SessionPauseModal } from "@/components/SessionPauseModal";
import { CitationList } from "@/components/tool-ui/citation";
import type { StudySet } from "@/lib/mock-data";
import {
  SAMPLE_FLASHCARDS,
  SAMPLE_IMAGES,
  SAMPLE_QUESTIONS,
  SAMPLE_SUMMARIES,
  sessionItemCount,
} from "@/lib/mock-data";
import type { QuizSearchParams } from "@/lib/routes";
import {
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Flag,
  Image,
  Pause,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";

function SessionNavButton({
  onClick,
  disabled,
  children,
  ariaLabel,
  variant = "neutral",
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  ariaLabel: string;
  variant?: "neutral" | "primary" | "danger" | "ai" | "pause";
}) {
  const styles = {
    neutral: {
      background: "#fff",
      border: "2px solid #e2e8f0",
      color: "#64748b",
      boxShadow: "0 2px 0 #e2e8f0",
    },
    primary: {
      background: "#58CC02",
      border: "2px solid #46A302",
      color: "#fff",
      boxShadow: "0 3px 0 #46A302",
    },
    danger: {
      background: "#fff",
      border: "2px solid #fecaca",
      color: "#dc2626",
      boxShadow: "0 2px 0 #fecaca",
    },
    pause: {
      background: "#FF4B4B",
      border: "2px solid #EA2D2D",
      color: "#fff",
      boxShadow: "0 3px 0 #EA2D2D",
    },
    ai: {
      background: "#f5f3ff",
      border: "2px solid #ddd6fe",
      color: "#6d28d9",
      boxShadow: "0 2px 0 #ddd6fe",
    },
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="w-11 h-11 rounded-xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-0.5"
      style={styles}
    >
      {children}
    </button>
  );
}

function LessonQuestionView({
  q,
  onAnswer,
}: {
  q: (typeof SAMPLE_QUESTIONS)[0];
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const citations = "citations" in q ? q.citations : [];

  const pickOption = (index: number) => {
    if (answered) return;
    setSelected(index);
    setAnswered(true);
    onAnswer(index === q.answer);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className="text-xs font-bold text-slate-500">{q.subject}</span>
        <button
          onClick={() => setBookmarked((prev) => !prev)}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark question"}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={
            bookmarked
              ? {
                  background: "#fff7ed",
                  border: "2px solid #fed7aa",
                  color: "#ea580c",
                }
              : {
                  background: "#f8fafc",
                  border: "2px solid #e2e8f0",
                  color: "#94a3b8",
                }
          }
        >
          <Bookmark
            size={18}
            strokeWidth={2.5}
            fill={bookmarked ? "#ea580c" : "none"}
          />
        </button>
      </div>

      <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 leading-snug">
        {q.text}
      </h2>

      <div className="flex flex-col gap-3 mb-6">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = answered && i === q.answer;
          const isWrong = answered && isSelected && i !== q.answer;
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => pickOption(i)}
              className="w-full p-4 rounded-2xl border-2 text-left font-semibold text-sm md:text-base transition-all active:scale-[0.99] disabled:cursor-default"
              style={
                isCorrect
                  ? {
                      background: "#f0fdf4",
                      borderColor: "#22c55e",
                      color: "#15803d",
                      boxShadow: "0 3px 0 #86efac",
                    }
                  : isWrong
                    ? {
                        background: "#fef2f2",
                        borderColor: "#f87171",
                        color: "#dc2626",
                        boxShadow: "0 3px 0 #fca5a5",
                      }
                    : isSelected
                      ? {
                          background: "#eff6ff",
                          borderColor: "#3b82f6",
                          color: "#1d4ed8",
                          boxShadow: "0 3px 0 #bfdbfe",
                        }
                      : {
                          background: "#fff",
                          borderColor: "#e2e8f0",
                          color: "#334155",
                          boxShadow: "0 3px 0 #e2e8f0",
                        }
              }
            >
              {opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          className="rounded-2xl p-5 md:p-6 mb-4 space-y-4"
          style={{ background: "#f0fdf4", border: "2px solid #bbf7d0" }}
        >
          <p className="text-sm font-black uppercase tracking-widest text-green-700">
            Explanation
          </p>
          <p className="text-base md:text-lg font-medium text-green-950 leading-relaxed">
            {q.explanation}
          </p>
          {citations.length > 0 && (
            <CitationList
              id={`citation-list-q${q.id}`}
              citations={citations}
              variant="stacked"
            />
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ s }: { s: (typeof SAMPLE_SUMMARIES)[0] }) {
  const [expanded, setExpanded] = useState(false);
  const preview = s.bullets.slice(0, 2);
  const rest = s.bullets.slice(2);

  return (
    <div
      className="bg-white rounded-3xl mb-3 overflow-hidden"
      style={{ border: "2px solid #e2e8f0", boxShadow: "0 2px 0 #e2e8f0" }}
    >
      <div className="px-4 pt-3 pb-1">
        <p className="font-black text-slate-900 text-base mb-3">{s.title}</p>
        <ul className="space-y-2">
          {preview.map((b, i) => (
            <li key={i} className="flex gap-2 text-sm font-medium text-slate-700">
              <span
                className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: "#7c3aed" }}
              />
              {b}
            </li>
          ))}
          {expanded &&
            rest.map((b, i) => (
              <li
                key={i + 2}
                className="flex gap-2 text-sm font-medium text-slate-700"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: "#7c3aed" }}
                />
                {b}
              </li>
            ))}
        </ul>
      </div>
      {rest.length > 0 && (
        <button
          onClick={() => setExpanded((p) => !p)}
          className="flex items-center gap-1 mx-4 my-2.5 text-xs font-black transition-colors"
          style={{ color: "#7c3aed" }}
        >
          {expanded ? (
            <>
              <ChevronUp size={13} strokeWidth={3} />
              Show less
            </>
          ) : (
            <>
              <ChevronDown size={13} strokeWidth={3} />+{rest.length} more points
            </>
          )}
        </button>
      )}
    </div>
  );
}

function ImageCard({ img }: { img: (typeof SAMPLE_IMAGES)[0] }) {
  return (
    <div
      className="bg-white rounded-3xl mb-3 overflow-hidden"
      style={{ border: "2px solid #e2e8f0", boxShadow: "0 2px 0 #e2e8f0" }}
    >
      <div
        className="w-full aspect-square flex items-center justify-center relative"
        style={{ background: img.gradient }}
      >
        <div className="text-center p-6">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-white/40">
            <Image size={28} className="text-white" strokeWidth={1.5} />
          </div>
          <p className="text-xs font-bold text-white/80">Medical Diagram</p>
        </div>
      </div>
      <div className="px-4 pb-4">
        <span className="text-sm font-medium text-slate-700">{img.caption}</span>
      </div>
    </div>
  );
}

function FlashCard({ card }: { card: (typeof SAMPLE_FLASHCARDS)[0] }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="mb-3 cursor-pointer"
      onClick={() => setFlipped((p) => !p)}
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative w-full transition-all duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          minHeight: "160px",
        }}
      >
        <div
          className="absolute inset-0 rounded-3xl p-5 flex flex-col justify-between"
          style={{
            backfaceVisibility: "hidden",
            background: "linear-gradient(135deg,#eff6ff,#dbeafe)",
            border: "2px solid #bfdbfe",
            boxShadow: "0 3px 0 #bfdbfe",
          }}
        >
          <p className="text-sm font-bold text-blue-900 leading-relaxed mt-3">
            {card.front}
          </p>
          <div className="flex justify-end mt-2">
            <RotateCcw size={14} className="text-blue-400" strokeWidth={2.5} />
          </div>
        </div>
        <div
          className="absolute inset-0 rounded-3xl p-5 flex flex-col justify-between"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
            border: "2px solid #86efac",
            boxShadow: "0 3px 0 #86efac",
          }}
        >
          <p className="text-sm font-bold text-green-900 leading-relaxed mt-3">
            {card.back}
          </p>
        </div>
      </div>
    </div>
  );
}

function initialPage(set: StudySet, total: number, quizParams: QuizSearchParams): number {
  if (quizParams.mode === "resume") {
    return Math.min(Math.max(1, set.done + 1), total);
  }
  return 1;
}

export function SetSessionView({
  set,
  tab,
  quizParams,
  onClose,
  onComplete,
}: {
  set: StudySet;
  tab: string;
  quizParams: QuizSearchParams;
  onClose: () => void;
  onComplete: () => void;
}) {
  const total = sessionItemCount(tab);
  const [page, setPage] = useState(() => initialPage(set, total, quizParams));
  const [answeredPage, setAnsweredPage] = useState<number | null>(null);
  const currentAnswered = answeredPage === page;
  const [reportOpen, setReportOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [questionChats, setQuestionChats] = useState<Record<string, ChatMessage[]>>({});

  const idx = Math.min(page, total) - 1;
  const remaining = Math.max(total - page, 0);
  const progressPct = total > 0 ? (page / total) * 100 : 0;

  const currentQuestion =
    tab === "questions" ? SAMPLE_QUESTIONS[idx] : undefined;
  const chatKey =
    currentQuestion !== undefined ? `${set.id}:${currentQuestion.id}` : "";

  const currentChat =
    chatKey && questionChats[chatKey]
      ? questionChats[chatKey]
      : currentQuestion
        ? createInitialChat(currentQuestion.text)
        : [];

  const updateChat = (messages: ChatMessage[]) => {
    if (!chatKey) return;
    setQuestionChats((prev) => ({ ...prev, [chatKey]: messages }));
  };

  const finishSession = () => {
    setChatOpen(false);
    setPauseOpen(false);
    onComplete();
  };

  const goNext = () => {
    if (tab === "questions" && !currentAnswered) return;
    setChatOpen(false);
    if (page < total) {
      setPage(page + 1);
      setAnsweredPage(null);
    } else finishSession();
  };

  const goBack = () => {
    setChatOpen(false);
    if (page > 1) {
      setPage(page - 1);
      setAnsweredPage(null);
    }
  };

  const openChat = () => {
    if (!currentQuestion || !chatKey) return;
    if (!questionChats[chatKey]) {
      setQuestionChats((prev) => ({
        ...prev,
        [chatKey]: createInitialChat(currentQuestion.text),
      }));
    }
    setChatOpen(true);
  };

  const renderSlide = () => {
    if (tab === "questions") {
      const q = SAMPLE_QUESTIONS[idx];
      if (!q) return null;
      return (
        <LessonQuestionView
          key={`${q.id}-${page}`}
          q={q}
          onAnswer={() => {
            setAnsweredPage(page);
          }}
        />
      );
    }
    if (tab === "summary") {
      const s = SAMPLE_SUMMARIES[idx];
      if (!s) return null;
      return <SummaryCard s={s} />;
    }
    if (tab === "images") {
      const img = SAMPLE_IMAGES[idx];
      if (!img) return null;
      return <ImageCard img={img} />;
    }
    if (tab === "flashcards") {
      const card = SAMPLE_FLASHCARDS[idx];
      if (!card) return null;
      return (
        <div className="flex items-center justify-center py-4">
          <FlashCard card={card} />
        </div>
      );
    }
    return (
      <p className="text-center text-slate-500 font-semibold py-20">
        No content for this tab yet.
      </p>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div
        className="flex items-center gap-3 px-4 h-14 flex-shrink-0 bg-white"
        style={{ borderBottom: "2px solid #e2e8f0" }}
      >
        <button
          onClick={() => setPauseOpen(true)}
          aria-label="Close session"
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ color: "#94a3b8" }}
        >
          <X size={22} strokeWidth={2.5} />
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,#58CC02,#46A302)",
              boxShadow: "0 2px 0 #3a8200",
            }}
          >
            <span className="text-white font-black text-sm leading-none">D</span>
          </div>
        </div>

        <div
          className="flex-1 h-3 rounded-full overflow-hidden min-w-0"
          style={{ background: "#e2e8f0" }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%`, background: "#58CC02" }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        <div className="max-w-3xl mx-auto w-full px-4 py-6 min-h-full flex flex-col flex-1">
          {renderSlide()}
        </div>
      </div>

      <div
        className="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3"
        style={{ borderTopWidth: "2px" }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SessionNavButton
              onClick={goBack}
              disabled={page <= 1}
              ariaLabel="Previous question"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </SessionNavButton>
            {tab === "questions" && (
              <SessionNavButton
                onClick={() => setReportOpen(true)}
                ariaLabel="Report issue"
                variant="danger"
              >
                <Flag size={18} strokeWidth={2.5} />
              </SessionNavButton>
            )}
          </div>

          <span className="shrink-0 rounded-lg border border-[#E5E5E5] bg-[#F7F7F7] px-2.5 py-1 text-xs font-extrabold tabular-nums text-[#AFAFAF]">
            {page} / {total}
          </span>

          <div className="flex items-center gap-2">
            <SessionNavButton
              onClick={() => setPauseOpen(true)}
              ariaLabel="Pause session"
              variant="pause"
            >
              <Pause size={16} strokeWidth={2.5} />
            </SessionNavButton>
            {tab === "questions" && (
              <SessionNavButton
                onClick={openChat}
                ariaLabel="Explain with AI"
                variant="ai"
              >
                <Sparkles size={18} strokeWidth={2.5} />
              </SessionNavButton>
            )}
            <SessionNavButton
              onClick={goNext}
              disabled={tab === "questions" && !currentAnswered}
              ariaLabel="Next question"
              variant="primary"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </SessionNavButton>
          </div>
        </div>
      </div>

      <SessionPauseModal
        open={pauseOpen}
        remaining={remaining}
        onResume={() => setPauseOpen(false)}
        onSaveLater={() => {
          setPauseOpen(false);
          onClose();
        }}
        onEnd={finishSession}
      />

      {currentQuestion && (
        <QuestionChatPanel
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          questionText={currentQuestion.text}
          messages={currentChat}
          onMessagesChange={updateChat}
        />
      )}

      <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
