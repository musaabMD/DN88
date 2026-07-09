"use client";

import { useState } from "react";
import { ChevronDown, Pencil, X } from "lucide-react";

export function SuggestEditModal({
  onClose,
  selectedText,
}: {
  onClose: () => void;
  selectedText?: string;
}) {
  const [summary, setSummary] = useState(
    selectedText ? `Selected text: "${selectedText}"` : ""
  );
  const [showContent, setShowContent] = useState(false);
  const [sources, setSources] = useState([""]);

  const canSubmit = summary.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="suggest-edit-title"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2
              id="suggest-edit-title"
              className="text-lg font-black tracking-tight text-slate-800"
            >
              Suggest an edit
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Spotted something off? Help us get it right.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label
              htmlFor="edit-summary"
              className="text-sm font-bold text-slate-700"
            >
              Summary
            </label>
            <textarea
              id="edit-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="What needs fixing? e.g., 'Birth year should be 1990, not 1989'"
              rows={3}
              className="mt-1.5 w-full resize-none rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowContent((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Edit content (optional)
            <ChevronDown
              size={16}
              strokeWidth={2.5}
              className={`transition-transform ${showContent ? "rotate-180" : ""}`}
            />
          </button>
          {showContent ? (
            <textarea
              placeholder="Paste your corrected version here"
              rows={4}
              className="w-full resize-none rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-400"
            />
          ) : null}

          <div>
            <label className="text-sm font-bold text-slate-700">
              Supporting sources (optional)
            </label>
            {sources.map((source, i) => (
              <input
                key={i}
                value={source}
                onChange={(e) => {
                  const next = [...sources];
                  next[i] = e.target.value;
                  setSources(next);
                }}
                placeholder="https://example.com/source"
                className="mt-1.5 w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-400"
              />
            ))}
            <button
              type="button"
              onClick={() => setSources((s) => [...s, ""])}
              className="mt-2 text-sm font-bold text-slate-500 hover:text-slate-700"
            >
              + Add another source
            </button>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="flex items-center gap-1.5 text-sm font-extrabold text-slate-700">
              <Pencil size={14} strokeWidth={2.5} className="text-slate-500" />
              What makes a great edit?
            </p>
            <ul className="mt-2 space-y-1 text-sm font-medium text-slate-600">
              <li>• Select the wrong text in the article first</li>
              <li>• Add a source link so we can verify</li>
              <li>• One fix per submission is easiest to review</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-2 border-slate-200 px-5 py-2 text-sm font-extrabold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={onClose}
            className="rounded-full bg-slate-600 px-5 py-2 text-sm font-extrabold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Submit Edit
          </button>
        </div>
      </div>
    </div>
  );
}
