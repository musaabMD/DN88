"use client";

import { Bookmark, Flag, Share2, Zap } from "lucide-react";
import type { NoteItem } from "@/lib/set-content";

export function HYNote({
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
