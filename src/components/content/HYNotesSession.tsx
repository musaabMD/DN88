"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { HYNote } from "@/components/content/HYNote";
import { ReportSheet } from "@/components/ReportSheet";
import type { NoteItem } from "@/lib/set-content";

export function HYNotesSession({
  notes,
  setTitle,
  onClose,
}: {
  notes: NoteItem[];
  setTitle: string;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const tags = useMemo(
    () => [...new Set(notes.map((n) => n.tag))],
    [notes]
  );

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
      <div
        className="flex shrink-0 items-center gap-3 border-b-2 border-slate-200 px-4 py-3"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notes"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
        >
          <X size={22} strokeWidth={2.5} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-slate-700">
            {setTitle}
          </p>
          <p className="text-xs font-bold text-slate-400">
            {filtered.length} HY notes
          </p>
        </div>
      </div>

      <div className="shrink-0 border-b-2 border-slate-100 px-4 py-3">
        <div className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl border-2 border-b-4 border-slate-200 bg-white px-4 py-2.5">
          <Search size={18} strokeWidth={2.5} className="shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes"
            className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="mx-auto mt-3 flex max-w-xl flex-wrap gap-2">
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
        <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-6">
          {filtered.length === 0 ? (
            <p className="py-16 text-center text-sm font-bold text-slate-400">
              No notes match your search.
            </p>
          ) : (
            filtered.map((note) => (
              <HYNote
                key={note.id}
                note={note}
                onReport={() => setReportOpen(true)}
              />
            ))
          )}
        </div>
      </div>

      <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
