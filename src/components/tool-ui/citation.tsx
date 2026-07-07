"use client";

import { ExternalLink } from "lucide-react";

export type Citation = {
  id: string;
  title: string;
  source: string;
  year?: string;
  url?: string;
};

export function CitationList({
  id,
  citations,
  variant = "stacked",
}: {
  id: string;
  citations: Citation[];
  variant?: "stacked" | "inline";
}) {
  if (variant === "inline") {
    return (
      <p id={id} className="text-sm text-slate-600 leading-relaxed">
        {citations.map((c, i) => (
          <span key={c.id}>
            [{i + 1}] {c.source}
            {c.year ? ` (${c.year})` : ""}
            {i < citations.length - 1 ? "; " : ""}
          </span>
        ))}
      </p>
    );
  }

  return (
    <ol
      id={id}
      className="space-y-2.5 list-none m-0 p-0"
      aria-label="References"
    >
      {citations.map((citation, index) => (
        <li
          key={citation.id}
          className="flex gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-black text-slate-600">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800 leading-snug">
              {citation.title}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {citation.source}
              {citation.year ? ` · ${citation.year}` : ""}
            </p>
            {citation.url ? (
              <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1.5 text-xs font-bold text-blue-600 hover:underline"
              >
                View source
                <ExternalLink size={11} strokeWidth={2.5} />
              </a>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
