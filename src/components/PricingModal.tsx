"use client";

import { Check, X } from "lucide-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";

const FREE_FEATURES = ["1 exam", "50 cards per day", "Basic stats"];
const PRO_FEATURES = [
  "All exams",
  "Unlimited cards",
  "Smart review schedule",
  "Detailed progress stats",
];

export function PricingModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <DrNoteLogo showWordmark />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close pricing"
            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-b-4 border-slate-200 bg-white text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 active:translate-y-0.5 active:border-b-2"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-center py-10">
          <h2 className="text-center text-3xl font-black tracking-tight text-slate-700 sm:text-4xl">
            Simple pricing
          </h2>
          <p className="mt-2 text-center text-sm font-bold text-slate-400">
            Start free, upgrade when you are ready
          </p>

          <div className="mx-auto mt-8 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col rounded-3xl border-2 border-b-4 border-slate-200 bg-white p-6">
              <h3 className="text-lg font-black text-slate-700">Free</h3>
              <p className="mt-2 text-3xl font-black tabular-nums text-slate-700">
                $0
                <span className="text-sm font-extrabold text-slate-400"> / month</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {FREE_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm font-bold text-slate-500"
                  >
                    <Check size={16} strokeWidth={3} className="shrink-0 text-slate-300" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 w-full rounded-xl border-2 border-b-4 border-slate-200 bg-white py-2.5 text-sm font-extrabold text-slate-700 transition-colors hover:bg-slate-50 active:translate-y-0.5 active:border-b-2"
              >
                Start free
              </button>
            </div>

            <div className="relative flex flex-col rounded-3xl border-b-4 border-[#46A302] bg-[#58CC02] p-6">
              <span className="absolute -top-3 right-6 rounded-full bg-[#46A302] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
                Most popular
              </span>
              <h3 className="text-lg font-black text-white">Pro</h3>
              <p className="mt-2 text-3xl font-black tabular-nums text-white">
                $9
                <span className="text-sm font-extrabold text-green-100"> / month</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {PRO_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm font-bold text-white"
                  >
                    <Check size={16} strokeWidth={3} className="shrink-0 text-green-200" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="mt-6 w-full rounded-xl border-b-4 border-slate-200 bg-white py-2.5 text-sm font-extrabold text-[#46A302] transition-colors hover:bg-green-50 active:translate-y-0.5 active:border-b-2"
              >
                Get Pro
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
