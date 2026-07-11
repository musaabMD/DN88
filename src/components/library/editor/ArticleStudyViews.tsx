"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Bot,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock,
  Network,
  RotateCcw,
  Send,
  X,
  Zap,
} from "lucide-react";
import {
  shouldShowSection,
  summarizeSectionText,
} from "@/components/content/ArticleStudyModes";
import { cn } from "@/lib/utils";
import type {
  FlashcardItem,
  LibraryArticle,
  LibraryArticleSection,
  QuestionItem,
} from "@/lib/set-content";

type AskMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const CHAT_STORAGE_PREFIX = "drnote-article-ask:";

function loadChat(articleId: string): AskMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${CHAT_STORAGE_PREFIX}${articleId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AskMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveChat(articleId: string, messages: AskMessage[]) {
  try {
    localStorage.setItem(
      `${CHAT_STORAGE_PREFIX}${articleId}`,
      JSON.stringify(messages)
    );
  } catch {
    /* ignore quota */
  }
}

function mockArticleReply(article: LibraryArticle, question: string): string {
  const overview =
    article.sections.find((s) => s.id === "summary" || s.id === "overview")
      ?.body ??
    article.summary ??
    article.title;
  const snippet = overview.slice(0, 220).trim();
  return `Based on ${article.title}: ${snippet}${overview.length > 220 ? "…" : ""}\n\nYou asked: “${question.trim()}”. Name a section if you want a tighter walkthrough.`;
}

function getArticleQuestions(article: LibraryArticle): QuestionItem[] {
  if (article.questions?.length) return article.questions;
  return article.sections.slice(0, 4).map((section, index) => ({
    id: index + 1,
    subject: article.subject,
    text: `Which statement best describes ${section.heading.toLowerCase()} in ${article.title.toLowerCase()}?`,
    options: [
      summarizeSectionText(section.body, section.bullets).slice(0, 120),
      "None of the above applies to this topic.",
      "This section is not clinically relevant.",
      "Further reading is required before answering.",
    ],
    answer: 0,
    tag: "Generated",
    status: "unused",
    explanation: section.body || (section.bullets?.[0] ?? ""),
    citations: [],
  }));
}

function getArticleFlashcards(article: LibraryArticle): FlashcardItem[] {
  if (article.flashcards?.length) return article.flashcards;
  const cards: FlashcardItem[] = [];
  for (const section of article.sections) {
    if (section.bullets?.length) {
      for (const bullet of section.bullets.slice(0, 2)) {
        cards.push({
          id: cards.length + 1,
          deck: section.heading,
          front: bullet.split(/[—–:-]/)[0]?.trim() || section.heading,
          back: bullet,
          status: "new",
        });
      }
    } else if (section.body) {
      cards.push({
        id: cards.length + 1,
        deck: section.heading,
        front: section.heading,
        back: summarizeSectionText(section.body),
        status: "new",
      });
    }
  }
  return cards.slice(0, 12);
}

function StudyViewShell({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="article-study-view">
      <header className="article-study-view-header">
        <p className="article-study-view-label">{label}</p>
        <h2 className="article-study-view-title">{title}</h2>
        {description ? (
          <p className="article-study-view-desc">{description}</p>
        ) : null}
      </header>
      {children}
    </div>
  );
}

function SectionBlock({ section }: { section: LibraryArticleSection }) {
  return (
    <section className="article-study-section">
      <h3 className="article-study-section-heading">{section.heading}</h3>
      {section.body ? (
        <p className="article-study-section-body">{section.body}</p>
      ) : null}
      {section.bullets?.length ? (
        <ul className="article-study-section-list">
          {section.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function ArticleHYView({ article }: { article: LibraryArticle }) {
  const sections = article.sections.filter((s) =>
    shouldShowSection(s.id, "hy")
  );

  return (
    <StudyViewShell
      label="High yield"
      title={article.title}
      description="Condensed sections and pearls for rapid review."
    >
      {article.highYield ? (
        <div className="article-study-hy-banner">
          <Zap size={18} strokeWidth={2.5} aria-hidden />
          <p>{article.highYield}</p>
        </div>
      ) : null}
      <div className="article-study-sections">
        {sections.map((section) => (
          <SectionBlock key={section.id} section={section} />
        ))}
      </div>
    </StudyViewShell>
  );
}

function QuestionCard({
  question,
  index,
  total,
  showResult,
  selected,
  onSelect,
  onNext,
}: {
  question: QuestionItem;
  index: number;
  total: number;
  showResult: boolean;
  selected: number | null;
  onSelect: (option: number) => void;
  onNext: () => void;
}) {
  const isCorrect = selected === question.answer;

  return (
    <div className="article-study-question">
      <div className="article-study-question-meta">
        <span>
          Question {index + 1} of {total}
        </span>
        {question.tag ? <span className="article-study-tag">{question.tag}</span> : null}
      </div>
      <p className="article-study-question-text">{question.text}</p>
      <div className="article-study-options" role="listbox">
        {question.options.map((option, optionIndex) => {
          const isSelected = selected === optionIndex;
          const isAnswer = optionIndex === question.answer;
          return (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={isSelected}
              disabled={showResult}
              className={cn(
                "article-study-option",
                showResult && isAnswer && "is-correct",
                showResult && isSelected && !isAnswer && "is-wrong",
                !showResult && isSelected && "is-selected"
              )}
              onClick={() => onSelect(optionIndex)}
            >
              <span className="article-study-option-key">
                {String.fromCharCode(65 + optionIndex)}
              </span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>
      {showResult ? (
        <div className="article-study-feedback">
          <p
            className={cn(
              "article-study-result",
              isCorrect ? "is-correct" : "is-wrong"
            )}
          >
            {isCorrect ? "Correct" : "Incorrect"}
          </p>
          <p className="article-study-explanation">{question.explanation}</p>
          <button type="button" className="article-study-primary-btn" onClick={onNext}>
            {index + 1 >= total ? "Finish" : "Next question"}
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ArticlePracticeView({ article }: { article: LibraryArticle }) {
  const questions = useMemo(() => getArticleQuestions(article), [article]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = questions[index];

  const reset = () => {
    setIndex(0);
    setSelected(null);
    setShowResult(false);
    setScore(0);
    setFinished(false);
  };

  if (!question) {
    return (
      <StudyViewShell label="Practice" title={article.title}>
        <p className="article-study-empty">No practice questions for this article yet.</p>
      </StudyViewShell>
    );
  }

  if (finished) {
    return (
      <StudyViewShell label="Practice" title={article.title}>
        <div className="article-study-summary">
          <p className="article-study-summary-score">
            {score} / {questions.length}
          </p>
          <p className="article-study-summary-label">questions correct</p>
          <button type="button" className="article-study-primary-btn" onClick={reset}>
            <RotateCcw size={16} strokeWidth={2.5} />
            Try again
          </button>
        </div>
      </StudyViewShell>
    );
  }

  return (
    <StudyViewShell
      label="Practice"
      title={article.title}
      description="Work through questions at your own pace with instant feedback."
    >
      <QuestionCard
        question={question}
        index={index}
        total={questions.length}
        showResult={showResult}
        selected={selected}
        onSelect={(option) => {
          setSelected(option);
          setShowResult(true);
          if (option === question.answer) setScore((s) => s + 1);
        }}
        onNext={() => {
          if (index + 1 >= questions.length) {
            setFinished(true);
            return;
          }
          setIndex((i) => i + 1);
          setSelected(null);
          setShowResult(false);
        }}
      />
    </StudyViewShell>
  );
}

export function ArticleExamView({ article }: { article: LibraryArticle }) {
  const questions = useMemo(() => getArticleQuestions(article), [article]);
  const examSeconds = Math.max(questions.length * 90, 300);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [remaining, setRemaining] = useState(examSeconds);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted) return;
    const timer = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(timer);
          setSubmitted(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [submitted]);

  const question = questions[index];
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const score = questions.reduce(
    (acc, q, i) => (answers[q.id] === q.answer ? acc + 1 : acc),
    0
  );

  if (!question) {
    return (
      <StudyViewShell label="Exam" title={article.title}>
        <p className="article-study-empty">No exam questions for this article yet.</p>
      </StudyViewShell>
    );
  }

  if (submitted) {
    return (
      <StudyViewShell label="Exam" title={article.title}>
        <div className="article-study-summary">
          <p className="article-study-summary-score">
            {score} / {questions.length}
          </p>
          <p className="article-study-summary-label">final score</p>
          <button
            type="button"
            className="article-study-primary-btn"
            onClick={() => {
              setIndex(0);
              setAnswers({});
              setRemaining(examSeconds);
              setSubmitted(false);
            }}
          >
            <RotateCcw size={16} strokeWidth={2.5} />
            Retake exam
          </button>
        </div>
      </StudyViewShell>
    );
  }

  return (
    <StudyViewShell
      label="Exam"
      title={article.title}
      description="Timed assessment — answers are revealed when you submit."
    >
      <div className="article-study-exam-bar">
        <span className="article-study-exam-timer">
          <Clock size={15} strokeWidth={2.5} />
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
        <span>
          {index + 1} / {questions.length}
        </span>
      </div>
      <div className="article-study-question">
        <p className="article-study-question-text">{question.text}</p>
        <div className="article-study-options">
          {question.options.map((option, optionIndex) => (
            <button
              key={option}
              type="button"
              className={cn(
                "article-study-option",
                answers[question.id] === optionIndex && "is-selected"
              )}
              onClick={() =>
                setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))
              }
            >
              <span className="article-study-option-key">
                {String.fromCharCode(65 + optionIndex)}
              </span>
              <span>{option}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="article-study-exam-nav">
        <button
          type="button"
          className="article-study-secondary-btn"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          <ChevronLeft size={16} />
          Previous
        </button>
        {index + 1 >= questions.length ? (
          <button
            type="button"
            className="article-study-primary-btn"
            onClick={() => setSubmitted(true)}
          >
            Submit exam
          </button>
        ) : (
          <button
            type="button"
            className="article-study-primary-btn"
            onClick={() => setIndex((i) => i + 1)}
          >
            Next
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </StudyViewShell>
  );
}

export function ArticleFlashcardsView({ article }: { article: LibraryArticle }) {
  const cards = useMemo(() => getArticleFlashcards(article), [article]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const card = cards[index];

  if (!card) {
    return (
      <StudyViewShell label="Flashcards" title={article.title}>
        <p className="article-study-empty">No flashcards for this article yet.</p>
      </StudyViewShell>
    );
  }

  return (
    <StudyViewShell
      label="Flashcards"
      title={article.title}
      description={`${index + 1} of ${cards.length} · tap to reveal`}
    >
      <div className="article-study-flashcard">
        <p className="article-study-flashcard-deck">{card.deck}</p>
        <button
          type="button"
          className="article-study-flashcard-face"
          onClick={() => setRevealed((r) => !r)}
        >
          <span className="article-study-flashcard-label">
            {revealed ? "Answer" : "Question"}
          </span>
          <p className="article-study-flashcard-text">
            {revealed ? card.back : card.front}
          </p>
        </button>
      </div>
      <div className="article-study-flashcard-nav">
        <button
          type="button"
          className="article-study-secondary-btn"
          disabled={index === 0}
          onClick={() => {
            setIndex((i) => i - 1);
            setRevealed(false);
          }}
        >
          <ChevronLeft size={16} />
          Previous
        </button>
        <button
          type="button"
          className="article-study-secondary-btn"
          onClick={() => setRevealed((r) => !r)}
        >
          {revealed ? "Hide answer" : "Show answer"}
        </button>
        <button
          type="button"
          className="article-study-secondary-btn"
          disabled={index + 1 >= cards.length}
          onClick={() => {
            setIndex((i) => i + 1);
            setRevealed(false);
          }}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </StudyViewShell>
  );
}

export function ArticleRoundView({ article }: { article: LibraryArticle }) {
  const sections = article.sections.filter((s) => s.id !== "summary");
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const section = sections[index];

  if (!section) {
    return (
      <StudyViewShell label="Round" title={article.title}>
        <p className="article-study-empty">No sections available for rounds.</p>
      </StudyViewShell>
    );
  }

  return (
    <StudyViewShell
      label="Round"
      title={article.title}
      description="Clinical case walkthrough — reveal each section like attending rounds."
    >
      <div className="article-study-round">
        <div className="article-study-round-progress">
          {sections.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={s.heading}
              className={cn(
                "article-study-round-dot",
                i === index && "is-active",
                i < index && "is-done"
              )}
              onClick={() => {
                setIndex(i);
                setRevealed(false);
              }}
            />
          ))}
        </div>
        <div className="article-study-round-prompt">
          <CircleDot size={18} strokeWidth={2.5} aria-hidden />
          <h3>{section.heading}</h3>
        </div>
        {revealed ? (
          <div className="article-study-round-reveal">
            <SectionBlock section={section} />
          </div>
        ) : (
          <p className="article-study-round-hint">
            What do you know about {section.heading.toLowerCase()}? Tap reveal when ready.
          </p>
        )}
        <div className="article-study-round-actions">
          {!revealed ? (
            <button
              type="button"
              className="article-study-primary-btn"
              onClick={() => setRevealed(true)}
            >
              Reveal section
            </button>
          ) : (
            <button
              type="button"
              className="article-study-primary-btn"
              disabled={index + 1 >= sections.length}
              onClick={() => {
                setIndex((i) => i + 1);
                setRevealed(false);
              }}
            >
              Next section
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </StudyViewShell>
  );
}

export function ArticleQAView({ article }: { article: LibraryArticle }) {
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setMessages(loadChat(article.id));
  }, [article.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (streamTimerRef.current !== null) {
        window.clearInterval(streamTimerRef.current);
      }
    };
  }, []);

  const streamAssistantReply = (
    assistantId: string,
    fullText: string,
    baseMessages: AskMessage[]
  ) => {
    if (streamTimerRef.current !== null) {
      window.clearInterval(streamTimerRef.current);
    }
    setStreamingId(assistantId);
    let index = 0;
    streamTimerRef.current = window.setInterval(() => {
      index = Math.min(index + 3, fullText.length);
      const partial = fullText.slice(0, index);
      const nextMessages = baseMessages.map((message) =>
        message.id === assistantId ? { ...message, content: partial } : message
      );
      setMessages(nextMessages);
      if (index >= fullText.length) {
        if (streamTimerRef.current !== null) {
          window.clearInterval(streamTimerRef.current);
          streamTimerRef.current = null;
        }
        setStreamingId(null);
        saveChat(article.id, nextMessages);
      }
    }, 16);
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || streamingId) return;

    const userMessage: AskMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    const assistantId = `a-${Date.now() + 1}`;
    const assistantMessage: AskMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };
    const nextMessages = [...messages, userMessage, assistantMessage];
    setMessages(nextMessages);
    setDraft("");
    streamAssistantReply(assistantId, mockArticleReply(article, text), nextMessages);
  };

  const clearChat = () => {
    if (streamTimerRef.current !== null) {
      window.clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    setStreamingId(null);
    setMessages([]);
    saveChat(article.id, []);
  };

  return (
    <StudyViewShell
      label="Q&A"
      title={article.title}
      description="Ask questions about this article."
    >
      <div className="article-study-qa">
        <div ref={scrollRef} className="article-study-qa-messages">
          {messages.length === 0 ? (
            <div className="article-study-qa-empty">
              <Bot size={28} strokeWidth={2} aria-hidden />
              <p>Ask anything about {article.title}.</p>
              <p className="article-study-qa-suggestions">
                Try: “Summarize diagnosis” or “First-line treatment?”
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "article-study-qa-message",
                  message.role === "user" ? "is-user" : "is-assistant"
                )}
              >
                {message.role === "assistant" ? (
                  <Bot size={16} strokeWidth={2.5} aria-hidden />
                ) : null}
                <p>{message.content || (streamingId === message.id ? "…" : "")}</p>
              </div>
            ))
          )}
        </div>
        <form className="article-study-qa-form" onSubmit={submit}>
          {messages.length > 0 ? (
            <button
              type="button"
              className="article-study-qa-clear"
              onClick={clearChat}
              aria-label="Clear chat"
            >
              <X size={16} />
            </button>
          ) : null}
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about this article…"
            disabled={Boolean(streamingId)}
          />
          <button
            type="submit"
            className="article-study-qa-send"
            disabled={!draft.trim() || Boolean(streamingId)}
            aria-label="Send"
          >
            <Send size={16} strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </StudyViewShell>
  );
}

function mindmapLeafLabel(text: string): string {
  const short = text.split(/[—–:-]/)[0]?.trim();
  const label = short || text;
  return label.length > 72 ? `${label.slice(0, 69)}…` : label;
}

export function ArticleMindmapView({ article }: { article: LibraryArticle }) {
  const sections = article.sections.filter((section) => section.id !== "summary");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    sections[0]?.id ?? null
  );

  const activeSection =
    sections.find((section) => section.id === activeSectionId) ?? sections[0];

  if (sections.length === 0) {
    return (
      <StudyViewShell label="Mindmap" title={article.title}>
        <p className="article-study-empty">No sections available for a mindmap.</p>
      </StudyViewShell>
    );
  }

  return (
    <StudyViewShell
      label="Mindmap"
      title={article.title}
      description="Visual overview — tap a branch to focus that section."
    >
      <div className="article-study-mindmap">
        <div className="article-study-mindmap-tree" role="tree" aria-label="Article mindmap">
          <div className="article-study-mindmap-root-node" role="treeitem" aria-expanded="true">
            <Network size={16} strokeWidth={2.5} aria-hidden />
            <span>{article.title}</span>
          </div>

          <div className="article-study-mindmap-spine" aria-hidden />

          <div className="article-study-mindmap-rail" aria-hidden />

          <div className="article-study-mindmap-branches">
            {sections.map((section) => {
              const leaves =
                section.bullets?.slice(0, 4).map((bullet) => mindmapLeafLabel(bullet)) ??
                (section.body
                  ? [mindmapLeafLabel(summarizeSectionText(section.body))]
                  : []);
              const isActive = section.id === activeSection?.id;

              return (
                <div
                  key={section.id}
                  className={cn(
                    "article-study-mindmap-branch",
                    isActive && "is-active"
                  )}
                  role="group"
                  aria-label={section.heading}
                >
                  <div className="article-study-mindmap-branch-spine" aria-hidden />
                  <button
                    type="button"
                    role="treeitem"
                    aria-selected={isActive}
                    className={cn(
                      "article-study-mindmap-node",
                      isActive && "is-active"
                    )}
                    onClick={() => setActiveSectionId(section.id)}
                  >
                    {section.heading}
                  </button>
                  {leaves.length > 0 ? (
                    <ul className="article-study-mindmap-leaves">
                      {leaves.map((leaf, leafIndex) => (
                        <li
                          key={`${section.id}-leaf-${leafIndex}`}
                          className="article-study-mindmap-leaf"
                        >
                          {leaf}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {activeSection ? (
          <div className="article-study-mindmap-detail">
            <p className="article-study-mindmap-detail-label">Focused section</p>
            <SectionBlock section={activeSection} />
          </div>
        ) : null}
      </div>
    </StudyViewShell>
  );
}
