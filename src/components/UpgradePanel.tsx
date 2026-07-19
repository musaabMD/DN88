"use client";

import { useState, type ReactNode } from "react";
import {
  BookOpen,
  Brain,
  Check,
  FileQuestion,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import { SignInButton, useAuth } from "@clerk/clerk-react";
import {
  createStripeCheckoutSession,
  createStripePortalSession,
  type BillingInterval,
  type CheckoutPlan,
} from "@/lib/stripe";
import { useDrNoteAccess } from "@/hooks/useDrNoteAccess";
import { useClerkEnabled, useClientMounted } from "@/hooks/useClerkEnabled";

const STUDENT_FEATURES = [
  { icon: FileQuestion, text: "All medical exams" },
  { icon: Layers, text: "Unlimited questions and flashcards" },
  { icon: Brain, text: "Study assistant for explanations" },
  { icon: BookOpen, text: "Full library access" },
] as const;

const PRO_FEATURES = [
  { icon: Sparkles, text: "Everything in Student" },
  { icon: Zap, text: "Faster study generation" },
  { icon: Brain, text: "More practice creation" },
  { icon: BookOpen, text: "Advanced study modes" },
] as const;

const PRICING: Record<
  CheckoutPlan,
  Record<BillingInterval, { amount: string; suffix: string; note?: string }>
> = {
  student: {
    monthly: { amount: "$20", suffix: "/ month" },
    yearly: {
      amount: "$16",
      suffix: "/ month",
      note: "Billed annually · save 20%",
    },
  },
  pro: {
    monthly: { amount: "$30", suffix: "/ month" },
    yearly: {
      amount: "$24",
      suffix: "/ month",
      note: "Billed annually · save 20%",
    },
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
}: {
  items: ReadonlyArray<{ icon: typeof FileQuestion; text: string }>;
}) {
  return (
    <ul className="mt-6 space-y-4">
      {items.map(({ text }) => (
        <li key={text} className="flex items-start gap-3 text-left">
          <Check
            size={20}
            strokeWidth={2.75}
            className="mt-0.5 shrink-0 text-emerald-600"
          />
          <span className="text-base font-bold leading-snug text-slate-700">
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
  footer: ReactNode;
}) {
  return (
    <article
      className={`relative flex flex-col rounded-[1.75rem] border-2 bg-white p-6 shadow-sm sm:p-8 ${
        highlighted
          ? "border-violet-300 bg-violet-50/40 ring-2 ring-violet-100"
          : "border-slate-200"
      }`}
    >
      {badge ? (
        <span className="absolute right-5 top-5 rounded-full bg-violet-100 px-3 py-1 text-xs font-extrabold text-violet-700">
          {badge}
        </span>
      ) : null}

      <h3 className="text-2xl font-black text-slate-900">{title}</h3>
      <p className="mt-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-slate-500">
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

      <FeatureList items={features} />
    </article>
  );
}

function CheckoutButton({
  plan,
  billing,
  loading,
  signedIn,
  authReady,
  onCheckout,
  clerkAuth,
}: {
  plan: CheckoutPlan;
  billing: BillingInterval;
  loading: boolean;
  signedIn: boolean;
  authReady: boolean;
  onCheckout: (plan: CheckoutPlan) => void;
  clerkAuth: boolean;
}) {
  const label = loading ? "Opening checkout..." : "Upgrade Now";

  if (!authReady && clerkAuth) {
    return (
      <button
        type="button"
        disabled
        className="mt-6 w-full rounded-2xl border-b-4 border-violet-300 bg-violet-100 py-4 text-lg font-black text-slate-500"
      >
        Checking account...
      </button>
    );
  }

  if (!signedIn) {
    if (clerkAuth) {
      return (
        <SignInButton mode="modal" fallbackRedirectUrl="/upgrade/">
          <button
            type="button"
            className="mt-6 w-full rounded-2xl border-b-4 border-violet-400 bg-violet-200 py-4 text-lg font-black text-slate-900 transition-colors hover:bg-violet-300 active:translate-y-0.5 active:border-b-2"
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
        className="mt-6 w-full rounded-2xl border-b-4 border-violet-400 bg-violet-200 py-4 text-lg font-black text-slate-900 opacity-70"
      >
        Sign in to upgrade
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onCheckout(plan)}
      disabled={loading}
      className="mt-6 w-full rounded-2xl border-b-4 border-violet-400 bg-violet-200 py-4 text-lg font-black text-slate-900 transition-colors hover:bg-violet-300 active:translate-y-0.5 active:border-b-2 disabled:opacity-70"
    >
      <Sparkles size={18} strokeWidth={2.5} className="mr-2 inline" />
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
  authReady,
  onCheckout,
  clerkAuth,
  currentPlan,
}: {
  billing: BillingInterval;
  setBilling: (billing: BillingInterval) => void;
  loading: boolean;
  error: string | null;
  signedIn: boolean;
  authReady: boolean;
  onCheckout: (plan: CheckoutPlan) => void;
  clerkAuth: boolean;
  currentPlan: string;
}) {
  const studentPrice = PRICING.student[billing];
  const proPrice = PRICING.pro[billing];

  return (
    <>
      <BillingToggle
        billing={billing}
        onChange={setBilling}
        disabled={loading}
      />

      <div className="mx-auto mt-8 grid max-w-4xl gap-5 md:grid-cols-2">
        <PlanCard
          title="Student"
          subtitle="Everything most students need to prepare."
          price={studentPrice.amount}
          priceSuffix={studentPrice.suffix}
          priceNote={studentPrice.note}
          badge={currentPlan === "student" ? "Current" : undefined}
          features={STUDENT_FEATURES}
          footer={
            currentPlan === "student" || currentPlan === "pro" ? (
              <button
                type="button"
                disabled
                className="mt-6 w-full rounded-2xl bg-emerald-50 py-4 text-base font-black text-emerald-700"
              >
                Active
              </button>
            ) : (
              <CheckoutButton
                plan="student"
                billing={billing}
                loading={loading}
                signedIn={signedIn}
                authReady={authReady}
                onCheckout={onCheckout}
                clerkAuth={clerkAuth}
              />
            )
          }
        />

        <PlanCard
          title="Pro"
          subtitle="More speed and creation for intensive prep."
          price={proPrice.amount}
          priceSuffix={proPrice.suffix}
          priceNote={proPrice.note}
          badge="Recommended"
          highlighted
          features={PRO_FEATURES}
          footer={
            currentPlan === "pro" ? (
              <button
                type="button"
                disabled
                className="mt-6 w-full rounded-2xl bg-emerald-50 py-4 text-base font-black text-emerald-700"
              >
                Your current plan
              </button>
            ) : (
              <CheckoutButton
                plan="pro"
                billing={billing}
                loading={loading}
                signedIn={signedIn}
                authReady={authReady}
                onCheckout={onCheckout}
                clerkAuth={clerkAuth}
              />
            )
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

function checkoutErrorMessage(error: unknown): string {
  const message =
    error instanceof Error ? error.message : "Checkout could not start.";

  if (/billing is not configured|stripe|price|secret|webhook/i.test(message)) {
    return "Checkout is being connected. Please try again shortly.";
  }

  return message;
}

function UpgradePanelClerk() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [billing, setBilling] = useState<BillingInterval>("yearly");
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signedIn = Boolean(isSignedIn);
  const access = useDrNoteAccess();

  const handleCheckout = (plan: CheckoutPlan) => {
    void (async () => {
      setError(null);

      if (!isLoaded) {
        setError("Checking your account. Please try again.");
        return;
      }

      if (!signedIn) {
        setError("Sign in to continue to secure checkout.");
        return;
      }

      setLoading(true);
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Sign in to continue to secure checkout.");
        }

        const url = await createStripeCheckoutSession(token, billing, plan);
        window.location.assign(url);
      } catch (checkoutError) {
        setError(checkoutErrorMessage(checkoutError));
        setLoading(false);
      }
    })();
  };

  const handleManageBilling = () => {
    void (async () => {
      setError(null);

      if (!isLoaded) {
        setError("Checking your account. Please try again.");
        return;
      }

      if (!signedIn) {
        setError("Sign in to manage billing.");
        return;
      }

      setPortalLoading(true);
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Sign in to manage billing.");
        }

        const url = await createStripePortalSession(token);
        window.location.assign(url);
      } catch (portalError) {
        setError("Could not open account settings. Please try again shortly.");
        setPortalLoading(false);
      }
    })();
  };

  const hasPaidPlan = access.plan === "student" || access.plan === "pro";

  return (
    <>
      {signedIn && (
        <p className="mx-auto mt-6 w-fit rounded-full bg-white px-4 py-2 text-sm font-extrabold text-slate-600 shadow-sm ring-1 ring-slate-200">
          Current plan: <span className="capitalize text-slate-900">{access.plan}</span>
        </p>
      )}

      {hasPaidPlan && (
        <div className="mx-auto mt-6 max-w-3xl text-center">
          <button
            type="button"
            onClick={handleManageBilling}
            disabled={portalLoading || loading}
            className="rounded-xl border-2 border-b-4 border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 transition-colors hover:bg-slate-50 active:translate-y-0.5 active:border-b-2 disabled:opacity-60"
          >
            {portalLoading ? "Opening billing portal…" : "Manage billing"}
          </button>
        </div>
      )}

      <UpgradePricingGrid
        billing={billing}
        setBilling={setBilling}
        loading={loading}
        error={error}
        signedIn={signedIn}
        authReady={isLoaded}
        onCheckout={handleCheckout}
        clerkAuth
        currentPlan={access.plan}
      />
    </>
  );
}

function UpgradePanelGuest() {
  const [billing, setBilling] = useState<BillingInterval>("yearly");

  return (
    <UpgradePricingGrid
      billing={billing}
      setBilling={setBilling}
      loading={false}
      error={null}
      signedIn={false}
      authReady={false}
      onCheckout={() => {}}
      clerkAuth={false}
      currentPlan="free"
    />
  );
}

function UpgradePanelLoading() {
  const [billing, setBilling] = useState<BillingInterval>("yearly");

  return (
    <UpgradePricingGrid
      billing={billing}
      setBilling={setBilling}
      loading={false}
      error={null}
      signedIn={false}
      authReady={false}
      onCheckout={() => {}}
      clerkAuth
      currentPlan="free"
    />
  );
}

export function UpgradePanel() {
  const clerkEnabled = useClerkEnabled();
  const mounted = useClientMounted();

  const content = (
    <>
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl">
          Unlock Everything with Pro
        </h1>
        <p className="mt-4 text-lg font-semibold leading-relaxed text-slate-500">
          Practice, review, and study faster with one simple plan.
        </p>
      </div>

      {!mounted ? (
        <UpgradePanelLoading />
      ) : !clerkEnabled ? (
        <UpgradePanelGuest />
      ) : (
        <UpgradePanelClerk />
      )}
    </>
  );

  return (
    <div className="min-h-full bg-slate-50 px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
      {content}
    </div>
  );
}
