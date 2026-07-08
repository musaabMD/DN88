"use client";

import { useMemo, useState } from "react";
import { Bookmark, Flag, Search, Share2, X, Zap } from "lucide-react";
import { ReportSheet } from "@/components/ReportSheet";
import type { NoteItem } from "@/lib/set-content";

function HYNote({
  note,
  onReport,
}: {
  note: NoteItem;
  onReport: () => void;
}) {
  return (
    <article className="w-full rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-b-4 border-green-600 bg-green-500">
          <span className="text-lg font-black text-white">
            {note.author.charAt(4)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-slate-700">
            {note.author}
          </p>
          <p className="truncate text-xs font-bold text-slate-400">
            {note.specialty}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-500 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
          <Zap size={12} strokeWidth={3} />
          HY
        </span>
      </div>

      <p className="mt-3 text-base font-bold leading-relaxed text-slate-700">
        {note.text}
      </p>

      <span className="mt-3 inline-block rounded-full border-2 border-slate-200 px-2.5 py-0.5 text-xs font-extrabold text-slate-400">
        #{note.tag}
      </span>

      <div className="mt-3 flex items-center gap-2 border-t-2 border-slate-100 pt-3">
        <button
          type="button"
          onClick={onReport}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
        >
          <Flag size={16} strokeWidth={2.5} />
          Report
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-400 transition-colors hover:bg-green-50 hover:text-green-600"
        >
          <Bookmark size={16} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          className="ml-auto flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <Share2 size={16} strokeWidth={2.5} />
        </button>
      </div>
    </article>
  );
}

export default function HYNotesFeed({
  notes,
  onClose,
}: {
  notes: NoteItem[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const tags = useMemo(() => [...new Set(notes.map((n) => n.tag))], [notes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((note) => {
      if (tagFilter && note.tag !== tagFilter) return false;
      if (!q) return true;
      return (
        note.text.toLowerCase().includes(q) ||
        note.author.toLowerCase().includes(q) ||
        note.specialty.toLowerCase().includes(q) ||
        note.tag.toLowerCase().includes(q)
      );
    });
  }, [notes, query, tagFilter]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex shrink-0 items-center gap-3 border-b-2 border-slate-200 px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to note sets"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
        >
          <X size={22} strokeWidth={2.5} />
        </button>
        <div className="mx-auto flex max-w-xl flex-1 items-center gap-3 rounded-2xl border-2 border-b-4 border-slate-200 bg-white px-4 py-2.5">
          <Search size={18} strokeWidth={2.5} className="shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes"
            className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="shrink-0 px-4 py-3">
        <div className="mx-auto flex max-w-xl flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTagFilter(null)}
            className={`rounded-full border-2 px-3 py-1 text-xs font-extrabold transition-colors ${
              tagFilter === null
                ? "border-green-500 bg-green-500 text-white"
                : "border-slate-200 text-slate-500 hover:border-green-500 hover:text-green-600"
            }`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setTagFilter(tag)}
              className={`rounded-full border-2 px-3 py-1 text-xs font-extrabold transition-colors ${
                tagFilter === tag
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-slate-200 text-slate-500 hover:border-green-500 hover:text-green-600"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-4 bg-white px-4 py-8">
          {filtered.map((n) => (
            <HYNote
              key={n.id}
              note={n}
              onReport={() => setReportOpen(true)}
            />
          ))}
        </div>
      </div>

      <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
