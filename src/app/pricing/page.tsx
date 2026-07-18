import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { UPGRADE_PATH } from "@/lib/routes";

export const metadata: Metadata = {
  title: "DrNote Pricing — Free, Student & Pro Plans for Medical Board Prep",
  description:
    "DrNote offers a free tier with 1 exam and 50 cards per day. Student ($20/mo) unlocks all exams and AI study tools. Pro ($30/mo) adds priority processing and advanced analytics.",
  openGraph: {
    title: "DrNote Pricing — Free, Student & Pro Plans",
    description:
      "Start free. Student $20/month for all exams and AI tools. Pro $30/month for priority processing and advanced analytics.",
  },
  robots: { index: true, follow: true },
};

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

      <section aria-labelledby="student-plan">
        <h2 id="student-plan">Student Plan</h2>
        <p>$20 per month</p>
        <ul>
          {STUDENT_FEATURES.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="pro-plan">
        <h2 id="pro-plan">Pro Plan</h2>
        <p>$30 per month</p>
        <ul>
          {PRO_FEATURES.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <Link href={UPGRADE_PATH}>Get Pro</Link>
      </section>

      <div className="not-sr-only mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-2xl font-black text-slate-700">Ready to upgrade?</h2>
        <p className="mt-2 text-sm font-bold text-slate-400">
          Student $20/month · Pro $30/month — unlimited exams, AI tools, and analytics.
        </p>
        <Link
          href={UPGRADE_PATH}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border-b-4 border-[#1e293b] bg-[#334155] px-6 py-3 text-sm font-extrabold text-white transition-colors hover:bg-[#475569] active:translate-y-0.5 active:border-b-2"
        >
          <Check size={16} strokeWidth={3} />
          View plans
        </Link>
      </div>
    </main>
  );
}
