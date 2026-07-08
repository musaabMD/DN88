"use client";

import { useMemo, useState } from "react";
import { Bookmark, Search, Share2, Zap } from "lucide-react";
import { ReportIconButton } from "@/components/ReportIconButton";
import type { NoteItem } from "@/lib/set-content";

function HYNote({ note }: { note: NoteItem }) {
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
        {note.tag}
      </span>

      <div className="mt-3 flex items-center gap-1 border-t-2 border-slate-100 pt-3">
        <ReportIconButton />
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-green-50 hover:text-green-600"
          aria-label="Bookmark"
        >
          <Bookmark size={16} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Share"
        >
          <Share2 size={16} strokeWidth={2.5} />
        </button>
      </div>
    </article>
  );
}

export default function HYNotesFeed({ notes }: { notes: NoteItem[] }) {
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

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
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-4 flex items-center gap-3 rounded-2xl border-2 border-b-4 border-slate-200 bg-white px-4 py-2.5">
        <Search size={18} strokeWidth={2.5} className="shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes"
          className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="mb-6 flex flex-wrap justify-center gap-2">
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
            {tag}
          </button>
        ))}
      </div>

      <div className="flex w-full flex-col gap-4">
        {filtered.map((n) => (
          <HYNote key={n.id} note={n} />
        ))}
      </div>
    </div>
  );
}
