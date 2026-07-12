"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  FileQuestion,
  Lock,
  Search,
  Sparkles,
} from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { ProductSiteNav } from "@/components/ProductSiteNav";
import { useClerkEnabled, useClientMounted } from "@/hooks/useClerkEnabled";
import { EXAMS } from "@/lib/exams";
import { filterLibraryArticles } from "@/lib/mock-data";
import {
  hasQbankPreorder,
  isQbankOwnerEmail,
  saveQbankPreorder,
} from "@/lib/qbank-access";
import {
  LIBRARY_PATH,
  QBANK_PATH,
  examPath,
} from "@/lib/routes";
import { MEDICAL_SPECIALTIES } from "@/lib/specialties";
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
    subtitle: "Specialties, topics, and articles written for study.",
    placeholder: "Search specialties, topics, or articles…",
  },
  qbank: {
    title: "Practice for your exam",
    subtitle: "Question sets, filters, and quiz modes when you are ready.",
    placeholder: "Search exams…",
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
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-100 bg-white">
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
}: {
  onClose: () => void;
  defaultEmail?: string;
}) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [examId, setExamId] = useState(EXAMS[0]?.id ?? "smle");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (defaultEmail) setEmail(defaultEmail);
  }, [defaultEmail]);

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

function CommandPanel({
  activeTab,
  query,
  onQuery,
  onSubmit,
}: {
  activeTab: HomeTab;
  query: string;
  onQuery: (value: string) => void;
  onSubmit: () => void;
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "library" ? (
            <Link
              href={LIBRARY_PATH}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-600 transition-colors hover:bg-slate-100"
            >
              <BookOpen size={14} strokeWidth={2.5} />
              Browse all
            </Link>
          ) : null}
          {activeTab === "qbank" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-600">
              <FileQuestion size={14} strokeWidth={2.5} />
              Exam practice
            </span>
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
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition-colors hover:bg-slate-700"
          aria-label="Submit"
        >
          <ArrowRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </form>
  );
}

function LibraryQuickLinks({ query }: { query: string }) {
  const router = useRouter();
  const articles = useMemo(
    () => filterLibraryArticles(query).slice(0, 4),
    [query]
  );
  const specialties = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MEDICAL_SPECIALTIES.slice(0, 6);
    return MEDICAL_SPECIALTIES.filter((s) => s.toLowerCase().includes(q)).slice(
      0,
      6
    );
  }, [query]);

  return (
    <div className="w-full max-w-2xl space-y-6">
      {query.trim() && articles.length > 0 ? (
        <div>
          <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-slate-400">
            Articles
          </p>
          <ul className="space-y-2">
            {articles.map((article) => (
              <li key={article.id}>
                <button
                  type="button"
                  onClick={() =>
                    router.push(`${LIBRARY_PATH}?q=${encodeURIComponent(query)}`)
                  }
                  className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-slate-800">
                      {article.title}
                    </p>
                    <p className="truncate text-xs font-bold text-slate-400">
                      {article.subject}
                    </p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-slate-400">
          {query.trim() ? "Specialties" : "Popular specialties"}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {specialties.map((specialty) => (
            <Link
              key={specialty}
              href={LIBRARY_PATH}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              {specialty}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function QbankQuickLinks({
  query,
  canOpenQbank,
  alreadyJoined,
  onJoinWaitlist,
}: {
  query: string;
  canOpenQbank: boolean;
  alreadyJoined: boolean;
  onJoinWaitlist: () => void;
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EXAMS;
    return EXAMS.filter(
      (exam) =>
        exam.name.toLowerCase().includes(q) ||
        exam.id.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="w-full max-w-2xl">
      <p className="mb-3 text-center text-xs font-extrabold uppercase tracking-wide text-slate-400">
        {canOpenQbank ? "Your exams" : "Exams coming soon"}
      </p>
      <ul className="space-y-2">
        {filtered.map((exam) => {
          const locked = !canOpenQbank;
          const inner = (
            <>
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white">
                <FileQuestion size={20} strokeWidth={2.5} />
                {locked ? (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-slate-700">
                    <Lock size={10} strokeWidth={3} />
                  </span>
                ) : null}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sm font-extrabold text-slate-800">
                  {exam.name}
                </p>
                <p className="text-xs font-bold text-slate-400">
                  {canOpenQbank
                    ? "Open practice sets"
                    : alreadyJoined
                      ? "On waitlist"
                      : "Join waitlist"}
                </p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-slate-300" />
            </>
          );

          const className =
            "group relative flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-slate-300 hover:bg-slate-50";

          if (locked) {
            return (
              <li key={exam.id}>
                <button type="button" onClick={onJoinWaitlist} className={className}>
                  {inner}
                </button>
              </li>
            );
          }

          return (
            <li key={exam.id}>
              <Link href={examPath(exam.id)} className={className}>
                {inner}
              </Link>
            </li>
          );
        })}
      </ul>

      {canOpenQbank ? (
        <div className="mt-4 text-center">
          <Link
            href={QBANK_PATH}
            className="text-sm font-extrabold text-emerald-800 hover:underline"
          >
            View all exams
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function AskQuickLinks({ query }: { query: string }) {
  const router = useRouter();
  const matches = useMemo(
    () => filterLibraryArticles(query).slice(0, 3),
    [query]
  );

  return (
    <div className="w-full max-w-2xl space-y-4">
      <p className="text-center text-sm font-bold text-slate-500">
        Ask opens inside any Library article — pick a topic to start chatting.
      </p>

      {query.trim() && matches.length > 0 ? (
        <ul className="space-y-2">
          {matches.map((article) => (
            <li key={article.id}>
              <button
                type="button"
                onClick={() =>
                  router.push(`${LIBRARY_PATH}?q=${encodeURIComponent(article.title)}`)
                }
                className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50/50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-800 text-white">
                  <Sparkles size={16} strokeWidth={2.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-slate-800">
                    {article.title}
                  </p>
                  <p className="text-xs font-bold text-slate-400">
                    Open and ask about this topic
                  </p>
                </div>
                <ChevronRight
                  size={18}
                  className="shrink-0 text-slate-300 group-hover:text-emerald-700"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          {["Heart failure", "Diabetes", "Pneumonia", "Sepsis"].map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() =>
                router.push(`${LIBRARY_PATH}?q=${encodeURIComponent(topic)}`)
              }
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50"
            >
              {topic}
            </button>
          ))}
        </div>
      )}
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
  const [showPreorder, setShowPreorder] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState(false);

  useEffect(() => {
    if (userEmail && hasQbankPreorder(userEmail)) setAlreadyJoined(true);
  }, [userEmail]);

  useEffect(() => {
    setQuery("");
  }, [activeTab]);

  const copy = TAB_COPY[activeTab];

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (activeTab === "library") {
      router.push(
        trimmed
          ? `${LIBRARY_PATH}?q=${encodeURIComponent(trimmed)}`
          : LIBRARY_PATH
      );
      return;
    }
    if (activeTab === "qbank") {
      if (canOpenQbank) {
        const match = EXAMS.find(
          (exam) =>
            !trimmed ||
            exam.name.toLowerCase().includes(trimmed.toLowerCase()) ||
            exam.id.toLowerCase().includes(trimmed.toLowerCase())
        );
        router.push(match ? examPath(match.id) : QBANK_PATH);
      } else {
        setShowPreorder(true);
      }
      return;
    }
    router.push(
      trimmed
        ? `${LIBRARY_PATH}?q=${encodeURIComponent(trimmed)}`
        : LIBRARY_PATH
    );
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
          />
        </div>

        <div className="mt-10 w-full flex justify-center">
          {activeTab === "library" ? (
            <LibraryQuickLinks query={query} />
          ) : activeTab === "qbank" ? (
            <QbankQuickLinks
              query={query}
              canOpenQbank={canOpenQbank}
              alreadyJoined={alreadyJoined}
              onJoinWaitlist={() => setShowPreorder(true)}
            />
          ) : (
            <AskQuickLinks query={query} />
          )}
        </div>
      </div>

      {showPreorder ? (
        <QbankPreorderPanel
          defaultEmail={userEmail}
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
