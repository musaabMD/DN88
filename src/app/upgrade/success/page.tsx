"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { HOME_PATH, UPGRADE_PATH } from "@/lib/routes";

export default function UpgradeSuccessPage() {
  return (
    <main className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white px-4 text-center">
      <CheckCircle2
        size={56}
        strokeWidth={2}
        className="text-emerald-500"
        aria-hidden
      />
      <h1 className="mt-4 text-2xl font-black text-slate-900">
        Welcome to Drnote Pro
      </h1>
      <p className="mt-2 max-w-sm text-sm font-medium text-slate-500">
        Your Stripe subscription is active. Pro features unlock as soon as
        payment confirmation completes.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={HOME_PATH}
          className="rounded-xl border-b-4 border-[#1e293b] bg-[#334155] px-5 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-[#475569] active:translate-y-0.5 active:border-b-2"
        >
          Back to home
        </Link>
        <Link
          href={UPGRADE_PATH}
          className="text-sm font-bold text-slate-500 hover:text-slate-700"
        >
          View plans
        </Link>
      </div>
    </main>
  );
}
