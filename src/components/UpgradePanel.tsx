"use client";

import { useState, type ReactNode } from "react";
import {
  BarChart3,
  BookOpen,
  Brain,
  FileQuestion,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import { useAuth, SignInButton } from "@clerk/clerk-react";
import { BRAND } from "@/lib/brand";
import {
  createStripeCheckoutSession,
  type BillingInterval,
} from "@/lib/stripe";
import { useClerkEnabled, useClientMounted } from "@/hooks/useClerkEnabled";

const FREE_FEATURES = [
  { icon: FileQuestion, text: "1 exam" },
  { icon: Layers, text: "50 cards per day" },
  { icon: BarChart3, text: "Basic progress stats" },
  { icon: BookOpen, text: "Library article reading" },
] as const;

const PRO_FEATURES = [
  { icon: FileQuestion, text: "All exams — SMLE, USMLE, and more" },
  { icon: Layers, text: "Unlimited flashcards & questions" },
  { icon: Brain, text: "Smart review schedule" },
  { icon: BarChart3, text: "Detailed progress analytics" },
  { icon: BookOpen, text: "Full library with rich study modes" },
  { icon: Zap, text: "High-yield filters & presentation mode" },
] as const;

const PRICING: Record<
  BillingInterval,
  { amount: string; suffix: string; note?: string }
> = {
  monthly: { amount: "$9.99", suffix: "/ month" },
  yearly: {
    amount: "$6.99",
    suffix: "/ month",
    note: "Billed annually · save 30%",
  },
};

function BillingToggle({
  billing,
  onChange,
  disabled,
}: {
  billing: BillingInterval;
  onChange: (billing: BillingInterval) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mx-auto mt-6 flex w-fit rounded-full bg-slate-200/70 p-1">
      {(["monthly", "yearly"] as const).map((interval) => {
        const active = billing === interval;
        return (
          <button
            key={interval}
            type="button"
            disabled={disabled}
            onClick={() => onChange(interval)}
            className={`rounded-full px-5 py-2 text-sm font-extrabold capitalize transition-all disabled:opacity-60 ${
              active
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {interval}
          </button>
        );
      })}
    </div>
  );
}

function FeatureList({
  items,
  accent,
}: {
  items: ReadonlyArray<{ icon: typeof FileQuestion; text: string }>;
  accent: "slate" | "indigo";
}) {
  const iconClass =
    accent === "indigo" ? "text-indigo-500" : "text-slate-400";

  return (
    <ul className="mt-6 space-y-3.5">
      {items.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-start gap-3 text-left">
          <Icon
            size={18}
            strokeWidth={2.25}
            className={`mt-0.5 shrink-0 ${iconClass}`}
          />
          <span className="text-sm font-semibold leading-snug text-slate-600">
            {text}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PlanCard({
  title,
  subtitle,
  price,
  priceSuffix,
  priceNote,
  badge,
  highlighted,
  features,
  accent,
  footer,
}: {
  title: string;
  subtitle: string;
  price: string;
  priceSuffix: string;
  priceNote?: string;
  badge?: string;
  highlighted?: boolean;
  features: ReadonlyArray<{ icon: typeof FileQuestion; text: string }>;
  accent: "slate" | "indigo";
  footer: ReactNode;
}) {
  return (
    <article
      className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm sm:p-7 ${
        highlighted
          ? "border-indigo-200 ring-2 ring-indigo-100"
          : "border-slate-200"
      }`}
    >
      {badge ? (
        <span className="absolute right-5 top-5 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-indigo-700">
          {badge}
        </span>
      ) : null}

      <h3 className="text-xl font-black text-slate-900">{title}</h3>
      <p className="mt-2 min-h-[2.5rem] text-sm font-medium leading-snug text-slate-500">
        {subtitle}
      </p>

      <div className="mt-5 flex items-end gap-1">
        <span className="text-4xl font-black tracking-tight text-slate-900">
          {price}
        </span>
        <span className="pb-1 text-sm font-bold text-slate-400">
          {priceSuffix}
        </span>
      </div>
      {priceNote ? (
        <p className="mt-1 text-xs font-bold text-emerald-600">{priceNote}</p>
      ) : (
        <p className="mt-1 text-xs font-bold text-transparent">.</p>
      )}

      {footer}

      <FeatureList items={features} accent={accent} />
    </article>
  );
}

function ProCheckoutButton({
  billing,
  loading,
  signedIn,
  onCheckout,
  clerkAuth,
}: {
  billing: BillingInterval;
  loading: boolean;
  signedIn: boolean;
  onCheckout: () => void;
  clerkAuth: boolean;
}) {
  const label = loading
    ? "Redirecting to Stripe…"
    : `Upgrade to Pro — ${PRICING[billing].amount}/mo`;

  if (!signedIn) {
    if (clerkAuth) {
      return (
        <SignInButton mode="modal">
          <button
            type="button"
            className="mt-6 w-full rounded-xl border-b-4 border-indigo-800 bg-indigo-600 py-3 text-sm font-extrabold text-white transition-colors hover:bg-indigo-500 active:translate-y-0.5 active:border-b-2"
          >
            Sign in to upgrade
          </button>
        </SignInButton>
      );
    }

    return (
      <button
        type="button"
        disabled
        className="mt-6 w-full rounded-xl border-b-4 border-indigo-800 bg-indigo-600 py-3 text-sm font-extrabold text-white opacity-70"
      >
        Sign in to upgrade
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onCheckout}
      disabled={loading}
      className="mt-6 w-full rounded-xl border-b-4 border-indigo-800 bg-indigo-600 py-3 text-sm font-extrabold text-white transition-colors hover:bg-indigo-500 active:translate-y-0.5 active:border-b-2 disabled:opacity-70"
    >
      {label}
    </button>
  );
}

function UpgradePricingGrid({
  billing,
  setBilling,
  loading,
  error,
  signedIn,
  onCheckout,
  clerkAuth,
}: {
  billing: BillingInterval;
  setBilling: (billing: BillingInterval) => void;
  loading: boolean;
  error: string | null;
  signedIn: boolean;
  onCheckout: () => void;
  clerkAuth: boolean;
}) {
  const proPrice = PRICING[billing];

  return (
    <>
      <BillingToggle
        billing={billing}
        onChange={setBilling}
        disabled={loading}
      />

      <div className="mx-auto mt-8 grid max-w-3xl gap-4 md:grid-cols-2 md:gap-5">
        <PlanCard
          title="Free"
          subtitle="Get started with core study tools"
          price="$0"
          priceSuffix="/ month"
          features={FREE_FEATURES}
          accent="slate"
          footer={
            <button
              type="button"
              disabled
              className="mt-6 w-full rounded-xl bg-slate-100 py-3 text-sm font-extrabold text-slate-400"
            >
              Your current plan
            </button>
          }
        />

        <PlanCard
          title="Pro"
          subtitle="Unlimited access for serious board prep"
          price={proPrice.amount}
          priceSuffix={proPrice.suffix}
          priceNote={proPrice.note}
          badge="Recommended"
          highlighted
          features={PRO_FEATURES}
          accent="indigo"
          footer={
            <ProCheckoutButton
              billing={billing}
              loading={loading}
              signedIn={signedIn}
              onCheckout={onCheckout}
              clerkAuth={clerkAuth}
            />
          }
        />
      </div>

      {error ? (
        <p className="mx-auto mt-4 max-w-3xl text-center text-xs font-bold text-rose-500">
          {error}
        </p>
      ) : (
        <p className="mx-auto mt-4 max-w-3xl text-center text-xs font-medium text-slate-400">
          Secure checkout powered by Stripe · Cancel anytime
        </p>
      )}
    </>
  );
}

function UpgradePanelClerk() {
  const [billing, setBilling] = useState<BillingInterval>("yearly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken, isSignedIn } = useAuth();

  const handleCheckout = () => {
    void (async () => {
      setError(null);

      if (!isSignedIn) {
        setError("Sign in to continue to secure checkout.");
        return;
      }

      setLoading(true);
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Sign in to continue to secure checkout.");
        }

        const url = await createStripeCheckoutSession(token, billing);
        window.location.assign(url);
      } catch (checkoutError) {
        const message =
          checkoutError instanceof Error
            ? checkoutError.message
            : "Checkout failed. Try again.";
        setError(message);
        setLoading(false);
      }
    })();
  };

  return (
    <UpgradePricingGrid
      billing={billing}
      setBilling={setBilling}
      loading={loading}
      error={error}
      signedIn={Boolean(isSignedIn)}
      onCheckout={handleCheckout}
      clerkAuth
    />
  );
}

function UpgradePanelGuest() {
  const [billing, setBilling] = useState<BillingInterval>("yearly");

  return (
    <UpgradePricingGrid
      billing={billing}
      setBilling={setBilling}
      loading={false}
      error="Sign in on drnote.co to upgrade with Stripe."
      signedIn={false}
      onCheckout={() => {}}
      clerkAuth={false}
    />
  );
}

export function UpgradePanel() {
  const clerkEnabled = useClerkEnabled();
  const mounted = useClientMounted();

  return (
    <div className="min-h-full bg-slate-50 px-4 pb-10 pt-6 sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-3xl text-center">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border-b-4"
          style={{
            background: `linear-gradient(135deg, ${BRAND.accent}, ${BRAND.accentDark})`,
            borderColor: BRAND.accentDark,
          }}
        >
          <Sparkles size={22} strokeWidth={2.5} className="text-white" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Upgrade your plan
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Simple pricing for medical board prep
        </p>
      </div>

      {!mounted || !clerkEnabled ? (
        <UpgradePanelGuest />
      ) : (
        <UpgradePanelClerk />
      )}
    </div>
  );
}
