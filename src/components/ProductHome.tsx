"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  ArrowRight,
  ChevronDown,
  FileQuestion,
  Search,
  Sparkles,
} from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { ProductSiteNav } from "@/components/ProductSiteNav";
import { useClerkEnabled, useClientMounted } from "@/hooks/useClerkEnabled";
import { DEFAULT_EXAM_ID, EXAMS, getExamById } from "@/lib/exams";
import { loadCurrentExamId, saveCurrentExamId } from "@/lib/current-exam";
import { entityPathForTopic } from "@/lib/entities";
import {
  ALL_SPECIALTY_TOPICS,
  filterSpecialtyTopics,
  type SpecialtyTopic,
} from "@/lib/specialties";
import {
  hasQbankPreorder,
  isQbankOwnerEmail,
  saveQbankPreorder,
} from "@/lib/qbank-access";
import {
  examPath,
} from "@/lib/routes";
import { cn } from "@/lib/utils";

type HomeTab = "library" | "qbank" | "ask";

const HOME_TABS: { id: HomeTab; label: string }[] = [
  { id: "library", label: "Library" },
  { id: "qbank", label: "Qbank" },
  { id: "ask", label: "Ask" },
];

const TAB_COPY: Record<
  HomeTab,
  { title: string; subtitle: string; placeholder: string }
> = {
  library: {
    title: "Browse clinical guides",
    subtitle: "Search topics or pick one below to open the guide.",
    placeholder: "Search topic names…",
  },
  qbank: {
    title: "Practice for your exam",
    subtitle: "Pick your exam first, then start practicing sets and quizzes.",
    placeholder: "Optional: search sets or topics…",
  },
  ask: {
    title: "Ask about any topic",
    subtitle: "Get answers grounded in DrNote articles — open a guide to keep chatting.",
    placeholder: "Ask anything about medicine…",
  },
};

function ProductHomeHeader() {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center">
            <DrNoteLogo showWordmark forceWordmark />
          </Link>

          <ProductSiteNav />
        </div>
      </header>
      <div className="h-[4.5rem] shrink-0" aria-hidden />
    </>
  );
}

function HomeTabNav({
  activeTab,
  onTabChange,
}: {
  activeTab: HomeTab;
  onTabChange: (tab: HomeTab) => void;
}) {
  return (
    <div
      className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1"
      role="tablist"
      aria-label="DrNote products"
    >
      {HOME_TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-extrabold transition-all duration-200 sm:px-6",
              active
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function QbankPreorderPanel({
  onClose,
  defaultEmail,
  defaultExamId,
}: {
  onClose: () => void;
  defaultEmail?: string;
  defaultExamId?: string;
}) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [examId, setExamId] = useState(
    defaultExamId || EXAMS[0]?.id || "smle"
  );
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (defaultEmail) setEmail(defaultEmail);
  }, [defaultEmail]);

  useEffect(() => {
    if (defaultExamId) setExamId(defaultExamId);
  }, [defaultExamId]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed.includes("@") || !trimmed.includes(".")) {
      setError("Enter a valid email");
      return;
    }
    saveQbankPreorder(trimmed, examId);
    setDone(true);
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
              Qbank early access
            </p>
            <h3 className="mt-1 text-xl font-black text-slate-900">
              Join the waitlist
            </h3>
            <p className="mt-1 text-sm font-bold text-slate-500">
              Tell us your email and exam — we&apos;ll notify you when Qbank opens.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-extrabold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            Close
          </button>
        </div>

        {done ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-center">
            <p className="text-base font-extrabold text-emerald-900">
              You&apos;re on the list
            </p>
            <p className="mt-1 text-sm font-bold text-emerald-700">
              We saved your email and exam preference.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-xl bg-emerald-800 px-4 py-2 text-sm font-extrabold text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-3">
            <label className="block text-left">
              <span className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-slate-400"
              />
            </label>
            <label className="block text-left">
              <span className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                Exam
              </span>
              <select
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-slate-400"
              >
                {EXAMS.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </label>
            {error ? (
              <p className="text-sm font-bold text-red-500">{error}</p>
            ) : null}
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-800 px-4 py-3 text-sm font-extrabold text-white transition-colors hover:bg-emerald-700"
            >
              Preorder notify me
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function ExamPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (examId: string) => void;
}) {
  const selected = getExamById(value);

  return (
    <label className="relative inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-2 text-xs font-extrabold text-slate-600">
      <FileQuestion size={14} strokeWidth={2.5} className="shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "max-w-[10.5rem] cursor-pointer appearance-none bg-transparent pr-5 text-xs font-extrabold outline-none sm:max-w-[12rem]",
          selected ? "text-slate-700" : "text-slate-400"
        )}
        aria-label="Select exam"
        required
      >
        <option value="" disabled>
          Select exam
        </option>
        {EXAMS.map((exam) => (
          <option key={exam.id} value={exam.id}>
            {exam.name}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        strokeWidth={2.5}
        className="pointer-events-none absolute right-2 shrink-0 text-slate-400"
      />
    </label>
  );
}

const FEATURED_TOPIC_TITLES = [
  "Heart failure with reduced ejection fraction",
  "Diabetes mellitus",
  "Community-acquired pneumonia",
  "Sepsis in adults",
  "Asthma in adults",
  "Chronic kidney disease",
  "ST-elevation myocardial infarction",
  "Established atrial fibrillation",
] as const;

function featuredTopics(): SpecialtyTopic[] {
  const byTitle = new Map(
    ALL_SPECIALTY_TOPICS.map((topic) => [topic.title, topic])
  );
  return FEATURED_TOPIC_TITLES.flatMap((title) => {
    const topic = byTitle.get(title);
    return topic ? [topic] : [];
  });
}

function openTopic(router: ReturnType<typeof useRouter>, topic: SpecialtyTopic) {
  router.push(entityPathForTopic(topic));
}

function CommandPanel({
  activeTab,
  query,
  onQuery,
  onSubmit,
  selectedExamId,
  onExamChange,
  canStartQbank,
}: {
  activeTab: HomeTab;
  query: string;
  onQuery: (value: string) => void;
  onSubmit: () => void;
  selectedExamId: string;
  onExamChange: (examId: string) => void;
  canStartQbank: boolean;
}) {
  const copy = TAB_COPY[activeTab];
  const Icon =
    activeTab === "ask" ? Sparkles : activeTab === "qbank" ? FileQuestion : Search;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="w-full max-w-2xl rounded-2xl border border-dashed border-slate-300 bg-white p-4 shadow-sm transition-shadow focus-within:border-slate-400 focus-within:shadow-md sm:p-5"
    >
      <div className="flex items-start gap-3">
        <Icon
          size={20}
          strokeWidth={2.5}
          className="mt-1 shrink-0 text-slate-400"
        />
        <textarea
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          rows={2}
          placeholder={copy.placeholder}
          className="min-h-[3rem] w-full resize-none bg-transparent text-base font-bold text-slate-800 outline-none placeholder:font-bold placeholder:text-slate-400"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "qbank" ? (
            <ExamPicker value={selectedExamId} onChange={onExamChange} />
          ) : null}
          {activeTab === "ask" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-600">
              <Sparkles size={14} strokeWidth={2.5} />
              Article-grounded
            </span>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={activeTab === "qbank" && !canStartQbank}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors",
            activeTab === "qbank" && !canStartQbank
              ? "cursor-not-allowed bg-slate-300"
              : "bg-slate-900 hover:bg-slate-700"
          )}
          aria-label={activeTab === "qbank" && !canStartQbank ? "Select an exam first" : "Submit"}
        >
          <ArrowRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </form>
  );
}

function TopicQuickLinks({
  query,
  label,
}: {
  query: string;
  label: string;
}) {
  const router = useRouter();
  const topics = useMemo(() => {
    const q = query.trim();
    if (q) return filterSpecialtyTopics(q).slice(0, 10);
    return featuredTopics();
  }, [query]);

  if (topics.length === 0) return null;

  return (
    <div className="w-full max-w-2xl">
      <p className="mb-3 text-center text-xs font-extrabold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {topics.map((topic) => (
          <button
            key={topic.id}
            type="button"
            onClick={() => openTopic(router, topic)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50"
          >
            {topic.title}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductHomeBody({
  canOpenQbank,
  userEmail,
}: {
  canOpenQbank: boolean;
  userEmail?: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<HomeTab>("library");
  const [query, setQuery] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [showPreorder, setShowPreorder] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState(false);

  useEffect(() => {
    if (userEmail && hasQbankPreorder(userEmail)) setAlreadyJoined(true);
  }, [userEmail]);

  useEffect(() => {
    const saved = loadCurrentExamId();
    if (saved) setSelectedExamId(saved);
  }, []);

  useEffect(() => {
    setQuery("");
  }, [activeTab]);

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    if (examId) saveCurrentExamId(examId);
  };

  const copy = TAB_COPY[activeTab];
  const canStartQbank = activeTab !== "qbank" || Boolean(selectedExamId);

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (activeTab === "library" || activeTab === "ask") {
      if (!trimmed) return;
      const match = filterSpecialtyTopics(trimmed)[0];
      if (match) openTopic(router, match);
      return;
    }
    if (activeTab === "qbank") {
      if (!selectedExamId) return;
      saveCurrentExamId(selectedExamId);
      if (canOpenQbank) {
        router.push(examPath(selectedExamId));
      } else {
        setShowPreorder(true);
      }
      return;
    }
  };

  return (
    <>
      <div className="flex flex-col items-center px-4 pb-16 pt-8 sm:pt-12">
        <HomeTabNav activeTab={activeTab} onTabChange={setActiveTab} />

        <div
          className="mt-10 max-w-2xl text-center"
          role="tabpanel"
          aria-label={copy.title}
        >
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm font-bold text-slate-500 sm:text-base">
            {copy.subtitle}
          </p>
        </div>

        <div className="mt-8 w-full flex justify-center">
          <CommandPanel
            activeTab={activeTab}
            query={query}
            onQuery={setQuery}
            onSubmit={handleSubmit}
            selectedExamId={selectedExamId}
            onExamChange={handleExamChange}
            canStartQbank={canStartQbank}
          />
        </div>

        {activeTab !== "qbank" ? (
          <div className="mt-10 w-full flex justify-center">
            <TopicQuickLinks
              query={query}
              label={
                query.trim()
                  ? "Matching topics"
                  : activeTab === "ask"
                    ? "Popular topics to ask about"
                    : "Popular topics"
              }
            />
          </div>
        ) : null}
      </div>

      {showPreorder ? (
        <QbankPreorderPanel
          defaultEmail={userEmail}
          defaultExamId={selectedExamId || DEFAULT_EXAM_ID}
          onClose={() => {
            setShowPreorder(false);
            if (userEmail && hasQbankPreorder(userEmail)) setAlreadyJoined(true);
          }}
        />
      ) : null}
    </>
  );
}

function ClerkGatedProducts() {
  const { user, isLoaded } = useUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress;
  const canOpen = isLoaded && isQbankOwnerEmail(email);

  return (
    <ProductHomeBody canOpenQbank={canOpen} userEmail={email} />
  );
}

export default function ProductHome() {
  const clerkEnabled = useClerkEnabled();
  const mounted = useClientMounted();

  return (
    <main className="min-h-screen bg-white">
      <ProductHomeHeader />

      {mounted && clerkEnabled ? (
        <ClerkGatedProducts />
      ) : (
        <ProductHomeBody canOpenQbank={false} />
      )}
    </main>
  );
}
