"use client";

import { useState } from "react";
import { Lightbulb, X } from "lucide-react";

export function SuggestArticleModal({ onClose }: { onClose: () => void }) {
  const [topic, setTopic] = useState("");
  const [details, setDetails] = useState("");

  const canSubmit = topic.trim().length > 0 || details.trim().length > 0;

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
        aria-labelledby="suggest-article-title"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2
              id="suggest-article-title"
              className="text-lg font-black tracking-tight text-slate-800"
            >
              Suggest an article
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Know something the world should know? Tell us what to write about.
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
              htmlFor="suggest-topic"
              className="text-sm font-bold text-slate-700"
            >
              Topic{" "}
              <span className="font-medium text-slate-400">
                (optional if you add details)
              </span>
            </label>
            <input
              id="suggest-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Quantum error correction, SpaceX Starship"
              className="mt-1.5 w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-400"
            />
          </div>

          <div>
            <label
              htmlFor="suggest-details"
              className="text-sm font-bold text-slate-700"
            >
              Details{" "}
              <span className="font-medium text-slate-400">
                (optional if you add a topic)
              </span>
            </label>
            <textarea
              id="suggest-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Why is this topic interesting? Any key points to cover?"
              rows={4}
              className="mt-1.5 w-full resize-none rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-400"
            />
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="flex items-center gap-1.5 text-sm font-extrabold text-slate-700">
              <Lightbulb size={15} strokeWidth={2.5} className="text-slate-500" />
              What makes a great suggestion?
            </p>
            <ul className="mt-2 space-y-1 text-sm font-medium text-slate-600">
              <li>• Specific beats broad — &apos;CRISPR&apos; over &apos;Biology&apos;</li>
              <li>• People, events, and breakthroughs are ideal</li>
              <li>• Search first to check if it already exists</li>
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
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
