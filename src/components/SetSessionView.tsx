"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  createInitialChat,
  QuestionChatPanel,
  type ChatMessage,
} from "@/components/QuestionChatPanel";
import FlashcardStudy from "@/components/content/FlashcardStudy";
import HYImages from "@/components/content/HYImages";
import HYNotesFeed from "@/components/content/HYNotesFeed";
import { ReportSheet } from "@/components/ReportSheet";
import { SessionPauseModal } from "@/components/SessionPauseModal";
import { CitationList } from "@/components/tool-ui/citation";
import { useSessionItems } from "@/hooks/useSessionItems";
import { useClerkEnabled } from "@/hooks/useClerkEnabled";
import { getClerkToken, isClerkSignedIn } from "@/lib/clerk-token";
import {
  createStudySession,
  recordAttempt,
} from "@/lib/medgenius/api";
import { isLiveSetId, liveDocumentId } from "@/lib/qbank/live-data";
import type { QuizSearchParams } from "@/lib/routes";
import type { StudySet } from "@/lib/set-content";
import {
  resolveSessionSetId,
  resolveSessionTab,
  sessionItemCount,
  type FlashcardItem,
  type ImageItem,
  type NoteItem,
  type QuestionItem,
} from "@/lib/set-content";
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
      background: "#334155",
      border: "2px solid #1e293b",
      color: "#fff",
      boxShadow: "0 3px 0 #1e293b",
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
  pickOptionRef,
}: {
  q: QuestionItem;
  onAnswer: (selectedIndex: number) => void;
  pickOptionRef?: React.MutableRefObject<(index: number) => void>;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const citations = "citations" in q ? q.citations : [];

  const pickOption = useCallback(
    (index: number) => {
      if (answered) return;
      setSelected(index);
      setAnswered(true);
      onAnswer(index);
    },
    [answered, onAnswer, q.answer]
  );

  useEffect(() => {
    if (pickOptionRef) pickOptionRef.current = pickOption;
  }, [pickOption, pickOptionRef]);

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
          <p className="text-sm font-black uppercase tracking-widest text-slate-700">
            Explanation
          </p>
          <p className="text-base md:text-lg font-medium text-slate-800 leading-relaxed">
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
  const clerkEnabled = useClerkEnabled();
  const backendSessionRef = useRef<string | null>(null);
  const total = sessionItems.length || sessionItemCount("questions", contentSetId);
  const [page, setPage] = useState(() => initialPage(set, total, quizParams));
  const [answeredPage, setAnsweredPage] = useState<number | null>(null);
  const currentAnswered = answeredPage === page;
  const [reportOpen, setReportOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [questionChats, setQuestionChats] = useState<Record<string, ChatMessage[]>>({});
  const pickOptionRef = useRef<(index: number) => void>(() => {});

  useEffect(() => {
    if (!clerkEnabled || !isClerkSignedIn() || !isLiveSetId(set.id)) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getClerkToken();
        if (!token) return;
        const created = await createStudySession(token, {
          mode: quizParams.mode ?? "quiz",
          title: set.title,
          documentId: liveDocumentId(set.id),
        });
        if (!cancelled) backendSessionRef.current = created.sessionId;
      } catch {
        /* local session still works */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clerkEnabled, quizParams.mode, set.id, set.title]);

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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (pauseOpen || reportOpen || chatOpen) return;
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      const q = sessionItems[idx];
      if (!q) return;

      const optionIndex = Number.parseInt(e.key, 10) - 1;
      if (
        e.key >= "1" &&
        e.key <= String(q.options.length) &&
        optionIndex >= 0 &&
        optionIndex < q.options.length &&
        !currentAnswered
      ) {
        e.preventDefault();
        pickOptionRef.current(optionIndex);
        return;
      }

      if (e.key === "Enter" && currentAnswered) {
        e.preventDefault();
        setChatOpen(false);
        if (page < total) {
          setPage(page + 1);
          setAnsweredPage(null);
        } else {
          setPauseOpen(false);
          onComplete();
        }
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setChatOpen(false);
        if (page > 1) {
          setPage(page - 1);
          setAnsweredPage(null);
        }
        return;
      }

      if (e.key === "ArrowRight" && currentAnswered) {
        e.preventDefault();
        setChatOpen(false);
        if (page < total) {
          setPage(page + 1);
          setAnsweredPage(null);
        } else {
          setPauseOpen(false);
          onComplete();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    chatOpen,
    currentAnswered,
    idx,
    onComplete,
    page,
    pauseOpen,
    reportOpen,
    sessionItems,
    total,
  ]);

  const renderSlide = () => {
    const q = sessionItems[idx];
    if (!q) return null;
    return (
      <LessonQuestionView
        key={`${q.id}-${page}`}
        q={q}
        pickOptionRef={pickOptionRef}
        onAnswer={(selectedIndex) => {
          setAnsweredPage(page);
          const q = sessionItems[idx];
          const sessionId = backendSessionRef.current;
          if (q?.questionId && sessionId && clerkEnabled && isClerkSignedIn()) {
            void (async () => {
              try {
                const token = await getClerkToken();
                if (!token) return;
                await recordAttempt(token, sessionId, {
                  questionId: q.questionId!,
                  selectedAnswer: selectedIndex,
                });
              } catch {
                /* ignore sync errors */
              }
            })();
          }
        }}
      />
    );
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <header
        className="flex-shrink-0 bg-white"
        style={{ borderBottom: "2px solid #e2e8f0" }}
      >
        <div className="flex h-14 items-center gap-3 px-4">
          <button
            onClick={() => setPauseOpen(true)}
            aria-label="Close session"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50"
          >
            <X size={22} strokeWidth={2.5} />
          </button>

          <h1 className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800 md:text-base">
            {set.title}
          </h1>

          <span className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-extrabold tabular-nums text-slate-400">
            {page} / {total}
          </span>
        </div>

        <div
          className="h-1.5 w-full overflow-hidden"
          style={{ background: "#e2e8f0" }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${progressPct}%`, background: "#334155" }}
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-6">
          {renderSlide()}
        </div>
      </div>

      <footer
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

          <span className="sr-only">
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
              ariaLabel={page >= total ? "Finish session" : "Next question"}
              variant="primary"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </SessionNavButton>
          </div>
        </div>
      </footer>

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
  const { items, loading, questions, notes, images, flashcards } = useSessionItems(
    contentTab,
    contentSetId
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white text-sm font-bold text-slate-400">
        Loading content…
      </div>
    );
  }

  if (contentTab === "summary") {
    return <HYNotesFeed notes={notes} />;
  }

  if (contentTab === "images") {
    return <HYImages images={images} />;
  }

  if (contentTab === "flashcards") {
    return <FlashcardStudy cards={flashcards} onClose={onClose} />;
  }

  return (
    <QuestionsSession
      set={set}
      contentSetId={contentSetId}
      sessionItems={questions.length > 0 ? questions : (items as QuestionItem[])}
      quizParams={quizParams}
      onClose={onClose}
      onComplete={onComplete}
    />
  );
}
