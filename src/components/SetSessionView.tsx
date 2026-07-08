"use client";

import { useState, type ReactNode } from "react";
import {
  createInitialChat,
  QuestionChatPanel,
  type ChatMessage,
} from "@/components/QuestionChatPanel";
import { FlashcardSession } from "@/components/content/FlashcardSession";
import { HYImagesSession } from "@/components/content/HYImagesSession";
import { HYNotesSession } from "@/components/content/HYNotesSession";
import { ReportSheet } from "@/components/ReportSheet";
import { SessionPauseModal } from "@/components/SessionPauseModal";
import { CitationList } from "@/components/tool-ui/citation";
import type { StudySet } from "@/lib/set-content";
import {
  getSessionItems,
  resolveSessionSetId,
  resolveSessionTab,
  sessionItemCount,
  type FlashcardItem,
  type ImageItem,
  type NoteItem,
  type QuestionItem,
} from "@/lib/set-content";
import type { QuizSearchParams } from "@/lib/routes";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Flag,
  Pause,
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
  q: QuestionItem;
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
          {citations && citations.length > 0 && (
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

function initialPage(set: StudySet, total: number, quizParams: QuizSearchParams): number {
  if (quizParams.mode === "resume") {
    return Math.min(Math.max(1, set.done + 1), total);
  }
  return 1;
}

function QuestionsSession({
  set,
  contentSetId,
  sessionItems,
  quizParams,
  onClose,
  onComplete,
}: {
  set: StudySet;
  contentSetId: string;
  sessionItems: QuestionItem[];
  quizParams: QuizSearchParams;
  onClose: () => void;
  onComplete: () => void;
}) {
  const total = sessionItemCount("questions", contentSetId);
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

  const currentQuestion = sessionItems[idx];
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
    if (!currentAnswered) return;
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
    const q = sessionItems[idx];
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
            <SessionNavButton
              onClick={() => setReportOpen(true)}
              ariaLabel="Report issue"
              variant="danger"
            >
              <Flag size={18} strokeWidth={2.5} />
            </SessionNavButton>
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
            <SessionNavButton
              onClick={openChat}
              ariaLabel="Explain with AI"
              variant="ai"
            >
              <Sparkles size={18} strokeWidth={2.5} />
            </SessionNavButton>
            <SessionNavButton
              onClick={goNext}
              disabled={!currentAnswered}
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
  const contentTab = resolveSessionTab(tab, set);
  const contentSetId = resolveSessionSetId(tab, set);
  const sessionItems = getSessionItems(contentTab, contentSetId);

  if (contentTab === "summary") {
    return (
      <HYNotesSession
        notes={sessionItems as NoteItem[]}
        setTitle={set.title}
        onClose={onClose}
      />
    );
  }

  if (contentTab === "images") {
    return (
      <HYImagesSession
        images={sessionItems as ImageItem[]}
        setTitle={set.title}
        onClose={onClose}
      />
    );
  }

  if (contentTab === "flashcards") {
    return (
      <FlashcardSession
        cards={sessionItems as FlashcardItem[]}
        setTitle={set.title}
        onClose={onClose}
        onComplete={onComplete}
      />
    );
  }

  return (
    <QuestionsSession
      set={set}
      contentSetId={contentSetId}
      sessionItems={sessionItems as QuestionItem[]}
      quizParams={quizParams}
      onClose={onClose}
      onComplete={onComplete}
    />
  );
}
