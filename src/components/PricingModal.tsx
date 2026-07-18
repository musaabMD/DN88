"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { SignInButton } from "@clerk/clerk-react";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import {
  createStripeCheckoutSession,
  type BillingInterval,
  type CheckoutPlan,
} from "@/lib/stripe";
import { getClerkToken, isClerkSignedIn } from "@/lib/clerk-token";
import { useClerkEnabled, useClientMounted } from "@/hooks/useClerkEnabled";

const FREE_FEATURES = ["1 exam", "50 cards per day", "Basic stats"];
const STUDENT_FEATURES = [
  "All exams & uploaded sets",
  "Unlimited flashcards",
  "AI tutor on questions",
  "Progress analytics",
];
const PRO_FEATURES = [
  "Everything in Student",
  "Priority processing",
  "AI practice questions",
  "Advanced analytics & SRS",
];

function PricingCard({
  title,
  price,
  suffix,
  features,
  highlight,
  badge,
  cta,
  onClick,
  loading,
}: {
  title: string;
  price: string;
  suffix: string;
  features: string[];
  highlight?: boolean;
  badge?: string;
  cta: string;
  onClick?: () => void;
  loading?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "relative flex flex-col rounded-3xl border-b-4 border-[#1e293b] bg-[#334155] p-6"
          : "flex flex-col rounded-3xl border-2 border-b-4 border-slate-200 bg-white p-6"
      }
    >
      {badge && (
        <span className="absolute -top-3 right-6 rounded-full bg-[#1e293b] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
          {badge}
        </span>
      )}
      <h3 className={`text-lg font-black ${highlight ? "text-white" : "text-slate-700"}`}>
        {title}
      </h3>
      <p
        className={`mt-2 text-3xl font-black tabular-nums ${highlight ? "text-white" : "text-slate-700"}`}
      >
        {price}
        <span
          className={`text-sm font-extrabold ${highlight ? "text-slate-200" : "text-slate-400"}`}
        >
          {" "}
          {suffix}
        </span>
      </p>
      <ul className="mt-5 flex-1 space-y-2.5">
        {features.map((feature) => (
          <li
            key={feature}
            className={`flex items-center gap-2 text-sm font-bold ${highlight ? "text-white" : "text-slate-500"}`}
          >
            <Check
              size={16}
              strokeWidth={3}
              className={`shrink-0 ${highlight ? "text-slate-300" : "text-slate-300"}`}
            />
            {feature}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={
          highlight
            ? "mt-6 w-full rounded-xl border-b-4 border-slate-200 bg-white py-2.5 text-sm font-extrabold text-[#1e293b] transition-colors hover:bg-slate-50 active:translate-y-0.5 active:border-b-2 disabled:opacity-60"
            : "mt-6 w-full rounded-xl border-2 border-b-4 border-slate-200 bg-white py-2.5 text-sm font-extrabold text-slate-700 transition-colors hover:bg-slate-50 active:translate-y-0.5 active:border-b-2 disabled:opacity-60"
        }
      >
        {loading ? "Redirecting…" : cta}
      </button>
    </div>
  );
}

export function PricingModal({ onClose }: { onClose: () => void }) {
  const clerkEnabled = useClerkEnabled();
  const mounted = useClientMounted();
  const [loadingPlan, setLoadingPlan] = useState<CheckoutPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const signedIn = mounted && clerkEnabled && isClerkSignedIn();

  const checkout = (plan: CheckoutPlan) => {
    void (async () => {
      setError(null);
      if (!signedIn) {
        setError("Sign in to continue to secure checkout.");
        return;
      }
      setLoadingPlan(plan);
      try {
        const token = await getClerkToken();
        if (!token) throw new Error("Sign in to continue to secure checkout.");
        const url = await createStripeCheckoutSession(token, "monthly", plan);
        window.location.assign(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Checkout failed.");
        setLoadingPlan(null);
      }
    })();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 py-6 sm:px-6">
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

          {error && (
            <p className="mx-auto mt-4 max-w-md text-center text-sm font-semibold text-red-500">
              {error}
            </p>
          )}

          <div className="mx-auto mt-8 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
            <PricingCard
              title="Free"
              price="$0"
              suffix="/ month"
              features={FREE_FEATURES}
              cta="Start free"
              onClick={onClose}
            />
            <PricingCard
              title="Student"
              price="$20"
              suffix="/ month"
              features={STUDENT_FEATURES}
              cta={signedIn ? "Get Student" : "Sign in to upgrade"}
              onClick={() => checkout("student")}
              loading={loadingPlan === "student"}
            />
            <PricingCard
              title="Pro"
              price="$30"
              suffix="/ month"
              features={PRO_FEATURES}
              highlight
              badge="Best value"
              cta={signedIn ? "Get Pro" : "Sign in to upgrade"}
              onClick={() => checkout("pro")}
              loading={loadingPlan === "pro"}
            />
          </div>

          {mounted && clerkEnabled && !signedIn && (
            <div className="mt-6 text-center">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="text-sm font-extrabold text-indigo-600 hover:text-indigo-700"
                >
                  Sign in
                </button>
              </SignInButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
