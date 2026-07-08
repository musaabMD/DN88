import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { UPGRADE_PATH } from "@/lib/routes";

export const metadata: Metadata = {
  title: "DrNote Pricing — Free & Pro Plans for Medical Board Prep",
  description:
    "DrNote offers a free tier with 1 exam and 50 cards per day. Upgrade to Pro for all exams, unlimited cards, smart review, and detailed progress stats.",
  openGraph: {
    title: "DrNote Pricing — Free & Pro Plans",
    description:
      "Start free, upgrade to Pro when you are ready. All exams, unlimited cards, smart review schedule.",
  },
  robots: { index: true, follow: true },
};

const FREE_FEATURES = ["1 exam", "50 cards per day", "Basic stats"];
const PRO_FEATURES = [
  "All exams",
  "Unlimited cards",
  "Smart review schedule",
  "Detailed progress stats",
];

export default function PricingPage() {
  return (
    <main className="sr-only" aria-label="DrNote pricing plans">
      <h1>DrNote Pricing</h1>
      <p>Simple pricing for medical board prep. Start free, upgrade when you are ready.</p>

      <section aria-labelledby="free-plan">
        <h2 id="free-plan">Free Plan</h2>
        <p>$0 per month</p>
        <ul>
          {FREE_FEATURES.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="pro-plan">
        <h2 id="pro-plan">Pro Plan</h2>
        <p>$9 per month</p>
        <ul>
          {PRO_FEATURES.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <Link href={UPGRADE_PATH}>Get Pro</Link>
      </section>

      {/* Visible fallback for users who land here directly */}
      <div className="not-sr-only mx-auto max-w-2xl px-4 py-16 text-center">
        <h2 className="text-2xl font-black text-slate-700">Ready to upgrade?</h2>
        <p className="mt-2 text-sm font-bold text-slate-400">
          Get unlimited access to all exams and content.
        </p>
        <Link
          href={UPGRADE_PATH}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border-b-4 border-[#46A302] bg-[#58CC02] px-6 py-3 text-sm font-extrabold text-white transition-colors hover:bg-[#4db802] active:translate-y-0.5 active:border-b-2"
        >
          <Check size={16} strokeWidth={3} />
          Get Pro
        </Link>
      </div>
    </main>
  );
}
