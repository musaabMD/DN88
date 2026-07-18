"use client";

import Link from "next/link";
import { Zap, FileText, Brain, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useMedGeniusCreditsContext } from "@/lib/medgenius/credits-context";
import type { CreditSummary } from "@/lib/medgenius/api";

function pct(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function UsageBar({
  label,
  used,
  limit,
  accent,
}: {
  label: string;
  used: number;
  limit: number;
  accent: string;
}) {
  const remaining = Math.max(0, limit - used);
  const fill = pct(used, limit);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-500">
          {remaining.toLocaleString()} / {limit.toLocaleString()} left
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${fill}%`, background: accent }}
        />
      </div>
    </div>
  );
}

function CreditsPanelBody({ credits }: { credits: CreditSummary }) {
  const creditsUsed = credits.creditsMonthlyLimit - credits.creditsBalance;

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {credits.plan} plan
        </span>
        <Link
          href="/upgrade"
          className="text-xs font-extrabold text-indigo-600 hover:text-indigo-500"
        >
          Upgrade
        </Link>
      </div>

      <UsageBar
        label="Monthly credits"
        used={creditsUsed}
        limit={credits.creditsMonthlyLimit}
        accent="#6366f1"
      />
      <UsageBar
        label="Documents"
        used={credits.documentsCount}
        limit={credits.documentsLimit}
        accent="#14b8a6"
      />
      <UsageBar
        label="Pages processed"
        used={credits.pagesProcessed}
        limit={credits.pagesLimit}
        accent="#f59e0b"
      />
      <UsageBar
        label="AI tokens today"
        used={credits.dailyAiTokens}
        limit={credits.dailyAiTokensLimit}
        accent="#a855f7"
      />
    </div>
  );
}

/** Compact badge showing remaining credits — for headers. */
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

  const low = credits.creditsBalance < credits.creditsMonthlyLimit * 0.1;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 transition-colors ${
          low
            ? "bg-rose-50 text-rose-700 ring-rose-200"
            : "bg-indigo-50 text-indigo-700 ring-indigo-200/80"
        }`}
        aria-expanded={open}
        aria-label="Credit usage"
      >
        <Zap size={14} strokeWidth={2.5} fill="currentColor" />
        {credits.creditsBalance.toLocaleString()}
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

/** Inline credits hint for chat panels. */
export function CreditsChatHint({ remaining }: { remaining?: number }) {
  const { credits, applyRemaining } = useMedGeniusCreditsContext();

  useEffect(() => {
    if (remaining !== undefined) {
      applyRemaining(remaining);
    }
  }, [remaining, applyRemaining]);

  const balance = remaining ?? credits?.creditsBalance;
  if (balance === undefined || balance === null) return null;

  const low = credits
    ? balance < credits.creditsMonthlyLimit * 0.1
    : balance < 50;

  return (
    <p
      className={`px-3 py-1.5 text-[11px] font-bold ${
        low ? "text-rose-600" : "text-slate-400"
      }`}
    >
      <Zap size={11} className="me-1 inline" strokeWidth={2.5} />
      {balance.toLocaleString()} credits remaining
    </p>
  );
}

/** Full credits card for upgrade / dashboard pages. */
export function CreditsUsageCard() {
  const { credits, loading, error, refresh } = useMedGeniusCreditsContext();

  if (loading && !credits) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-400">
        Loading usage…
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
          <div className="flex items-center gap-2 text-indigo-600">
            <Zap size={20} strokeWidth={2.5} />
            <h2 className="text-lg font-black text-slate-900">Your usage</h2>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Credits power document parsing, AI chat, and study content generation.
          </p>
        </div>
        <div className="text-end">
          <p className="text-3xl font-black text-slate-900">
            {credits.creditsBalance.toLocaleString()}
          </p>
          <p className="text-xs font-bold text-slate-400">credits left</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <UsageBar
          label="Monthly credits"
          used={credits.creditsMonthlyLimit - credits.creditsBalance}
          limit={credits.creditsMonthlyLimit}
          accent="#6366f1"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <FileText size={18} className="text-teal-600" strokeWidth={2.25} />
            <div>
              <p className="text-xs font-bold text-slate-500">Documents</p>
              <p className="text-sm font-extrabold text-slate-800">
                {credits.documentsCount} / {credits.documentsLimit}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <Brain size={18} className="text-violet-600" strokeWidth={2.25} />
            <div>
              <p className="text-xs font-bold text-slate-500">AI tokens today</p>
              <p className="text-sm font-extrabold text-slate-800">
                {credits.dailyAiTokens.toLocaleString()} /{" "}
                {credits.dailyAiTokensLimit.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Link
        href="/upgrade"
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl border-b-4 border-indigo-800 bg-indigo-600 py-3 text-sm font-extrabold text-white transition-colors hover:bg-indigo-500"
      >
        Get more credits
      </Link>
    </div>
  );
}
