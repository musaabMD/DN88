"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  Clock3,
  ListTree,
  X,
  Zap,
} from "lucide-react";
import type { LibraryArticle } from "@/lib/set-content";

export function LibraryArticleView({
  article,
  onClose,
  onBack,
}: {
  article: LibraryArticle;
  onClose: () => void;
  onBack?: () => void;
}) {
  const [activeSection, setActiveSection] = useState(
    article.sections[0]?.id ?? ""
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <article className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack ?? onClose}
            className="flex items-center gap-1.5 rounded-xl border-2 border-b-4 border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-500 transition-colors hover:bg-slate-50 active:translate-y-0.5 active:border-b-2"
          >
            <ArrowLeft size={14} strokeWidth={3} />
            Library
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-b-4 border-slate-200 bg-white text-slate-400 transition-colors hover:bg-green-50 hover:text-green-600 active:translate-y-0.5 active:border-b-2"
              aria-label="Save article"
            >
              <Bookmark size={16} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close article"
              className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-b-4 border-slate-200 bg-white text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 active:translate-y-0.5 active:border-b-2"
            >
              <X size={18} strokeWidth={3} />
            </button>
          </div>
        </div>

        <header className="mt-6">
          <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
            {article.subject}
          </span>
          <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-800 sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-2 flex items-center gap-3 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1">
              <Clock3 size={13} strokeWidth={2.5} /> {article.readMinutes} min read
            </span>
            <span>Updated {article.updated}</span>
          </p>
        </header>

        <nav className="mt-5 flex flex-wrap gap-2" aria-label="Contents">
          <span className="flex items-center gap-1 text-xs font-extrabold uppercase tracking-wide text-slate-400">
            <ListTree size={14} strokeWidth={2.5} /> Jump to
          </span>
          {article.sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setActiveSection(s.id);
                document
                  .getElementById(s.id)
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`rounded-full border-2 px-3 py-1 text-xs font-extrabold transition-colors ${
                activeSection === s.id
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-slate-200 text-slate-500 hover:border-green-500 hover:text-green-600"
              }`}
            >
              {s.heading}
            </button>
          ))}
        </nav>

        <div className="mt-8 space-y-6">
          {article.sections.map((section) => (
            <section key={section.id} id={section.id}>
              <h2 className="text-xl font-black tracking-tight text-slate-800">
                {section.heading}
              </h2>
              {section.body ? (
                <p className="mt-2 text-base font-medium leading-relaxed text-slate-600">
                  {section.body}
                </p>
              ) : null}
              {section.bullets && section.bullets.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {section.bullets.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-base font-medium leading-relaxed text-slate-600"
                    >
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}

          {article.highYield ? (
            <aside className="rounded-2xl border-2 border-b-4 border-green-500 bg-green-50 p-4 sm:p-5">
              <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-green-600">
                <Zap size={14} strokeWidth={3} /> High yield
              </p>
              <p className="mt-2 text-sm font-bold leading-relaxed text-slate-700">
                {article.highYield}
              </p>
            </aside>
          ) : null}
        </div>
      </article>
    </div>
  );
}
