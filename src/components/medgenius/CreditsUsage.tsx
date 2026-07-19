"use client";

import Link from "next/link";
import { Sparkles, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useMedGeniusCreditsContext } from "@/lib/medgenius/credits-context";
import type { CreditSummary } from "@/lib/medgenius/api";

function CreditsPanelBody({ credits }: { credits: CreditSummary }) {
  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
          Plan
        </span>
        <Link
          href="/upgrade"
          className="text-xs font-extrabold text-slate-700 hover:text-slate-900"
        >
          Upgrade
        </Link>
      </div>
      <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-black capitalize text-slate-900">
        {credits.plan}
      </p>
    </div>
  );
}

/** Compact badge showing the current plan for headers. */
export function CreditsBadge({ className = "" }: { className?: string }) {
  const { credits, loading } = useMedGeniusCreditsContext();
  const [open, setOpen] = useState(false);

  if (loading && !credits) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-400 ${className}`}
      >
        <Zap size={14} strokeWidth={2.5} />
        …
      </span>
    );
  }

  if (!credits) return null;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-extrabold text-indigo-700 ring-1 ring-indigo-200/80 transition-colors"
        aria-expanded={open}
        aria-label="Plan menu"
      >
        <Zap size={14} strokeWidth={2.5} fill="currentColor" />
        <span className="capitalize">{credits.plan}</span>
        {open ? (
          <ChevronUp size={12} strokeWidth={3} />
        ) : (
          <ChevronDown size={12} strokeWidth={3} />
        )}
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close credits panel"
            onClick={() => setOpen(false)}
          />
          <div className="absolute end-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <CreditsPanelBody credits={credits} />
          </div>
        </>
      )}
    </div>
  );
}

/** Minimal account plan card for dashboard pages. */
export function CreditsUsageCard() {
  const { credits, loading, error, refresh } = useMedGeniusCreditsContext();

  if (loading && !credits) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-400">
        Loading plan…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-600">
        {error}
        <button
          type="button"
          onClick={() => void refresh()}
          className="ms-2 font-extrabold underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!credits) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-violet-600">
            <Sparkles size={20} strokeWidth={2.5} />
            <h2 className="text-lg font-black text-slate-900">Your plan</h2>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage your DrNote access.
          </p>
        </div>
        <div className="text-end">
          <p className="text-2xl font-black capitalize text-slate-900">
            {credits.plan}
          </p>
          <p className="text-xs font-bold text-slate-400">active plan</p>
        </div>
      </div>

      <Link
        href="/upgrade"
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl border-b-4 border-slate-800 bg-slate-700 py-3 text-sm font-extrabold text-white transition-colors hover:bg-slate-600"
      >
        View plans
      </Link>
    </div>
  );
}
