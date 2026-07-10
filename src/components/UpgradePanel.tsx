"use client";

import { useState, type ReactNode } from "react";
import { Crown } from "lucide-react";
import { useAuth, SignInButton } from "@clerk/clerk-react";
import {
  createStripeCheckoutSession,
  type BillingInterval,
} from "@/lib/stripe";
import { useClerkEnabled, useClientMounted } from "@/hooks/useClerkEnabled";

const PRO_PRICE_LABEL: Record<BillingInterval, string> = {
  monthly: "$9.99/mo",
  yearly: "$6.99/mo",
};

const checkoutButtonClass =
  "w-full py-3 rounded-2xl font-black text-sm text-white disabled:opacity-70";

const checkoutButtonStyle = (showHero: boolean) => ({
  background: "linear-gradient(135deg,#a855f7,#7c3aed)",
  border: "2px solid #6d28d9",
  boxShadow: showHero ? "0 3px 0 #6d28d9" : undefined,
});

function UpgradePanelBody({
  billing,
  setBilling,
  loading,
  error,
  showHero,
  action,
}: {
  billing: BillingInterval;
  setBilling: (billing: BillingInterval) => void;
  loading: boolean;
  error: string | null;
  showHero: boolean;
  action: ReactNode;
}) {
  return (
    <div className="max-w-md mx-auto px-4 py-6 text-center">
      {showHero ? (
        <div
          className="w-14 h-14 rounded-3xl mx-auto mb-3 flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg,#a855f7,#7c3aed)",
            boxShadow: "0 4px 0 #6d28d9",
          }}
        >
          <Crown size={26} strokeWidth={2} className="text-white" />
        </div>
      ) : null}

      <h2 className="text-xl font-black text-slate-900 mb-1">
        Go Pro, Study Smarter
      </h2>
      <p className="text-sm font-medium text-slate-400 mb-6">
        Unlimited access to everything in Drnote
      </p>

      <div className="flex items-center justify-center mb-6">
        <div
          className="flex p-1 rounded-2xl gap-1"
          style={{ background: "#f1f5f9", border: "2px solid #e2e8f0" }}
        >
          {(["monthly", "yearly"] as const).map((interval) => (
            <button
              key={interval}
              type="button"
              onClick={() => setBilling(interval)}
              disabled={loading}
              className="px-5 py-2 rounded-xl font-black text-sm transition-all capitalize disabled:opacity-60"
              style={
                billing === interval
                  ? {
                      background: "#7c3aed",
                      color: "#fff",
                      boxShadow: showHero ? "0 2px 0 #6d28d9" : undefined,
                    }
                  : { color: "#94a3b8" }
              }
            >
              {interval}
            </button>
          ))}
        </div>
      </div>

      {action}

      {error ? (
        <p className="mt-3 text-xs font-bold text-rose-500">{error}</p>
      ) : (
        <p className="mt-3 text-xs font-medium text-slate-400">
          Secure checkout powered by Stripe
        </p>
      )}
    </div>
  );
}

function UpgradePanelClerk({ showHero }: { showHero: boolean }) {
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

  const action = !isSignedIn ? (
    <SignInButton mode="modal">
      <button
        type="button"
        className={checkoutButtonClass}
        style={checkoutButtonStyle(showHero)}
      >
        Sign in to upgrade — {PRO_PRICE_LABEL[billing]}
      </button>
    </SignInButton>
  ) : (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={loading}
      className={checkoutButtonClass}
      style={checkoutButtonStyle(showHero)}
    >
      {loading
        ? "Redirecting to Stripe…"
        : `Upgrade to Pro — ${PRO_PRICE_LABEL[billing]}`}
    </button>
  );

  return (
    <UpgradePanelBody
      billing={billing}
      setBilling={setBilling}
      loading={loading}
      error={error}
      showHero={showHero}
      action={action}
    />
  );
}

function UpgradePanelGuest({ showHero }: { showHero: boolean }) {
  const [billing, setBilling] = useState<BillingInterval>("yearly");

  return (
    <UpgradePanelBody
      billing={billing}
      setBilling={setBilling}
      loading={false}
      error="Sign in on drnote.co to upgrade with Stripe."
      showHero={showHero}
      action={
        <button
          type="button"
          disabled
          className={checkoutButtonClass}
          style={checkoutButtonStyle(showHero)}
        >
          Sign in to upgrade — {PRO_PRICE_LABEL[billing]}
        </button>
      }
    />
  );
}

export function UpgradePanel({ showHero = false }: { showHero?: boolean }) {
  const clerkEnabled = useClerkEnabled();
  const mounted = useClientMounted();

  if (!mounted || !clerkEnabled) {
    return <UpgradePanelGuest showHero={showHero} />;
  }

  return <UpgradePanelClerk showHero={showHero} />;
}
