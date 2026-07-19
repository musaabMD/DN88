import type { Metadata } from "next";
import { UpgradePanel } from "@/components/UpgradePanel";

export const metadata: Metadata = {
  title: "DrNote Pricing — Free & Pro Plans",
  description:
    "Start free with DrNote, then upgrade to Pro for all exams, unlimited cards, smart review, and detailed progress stats.",
  openGraph: {
    title: "DrNote Pricing — Free & Pro Plans",
    description:
      "Start free, upgrade to Pro when you are ready. All exams, unlimited cards, and smart review tools.",
  },
  robots: { index: true, follow: true },
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-50" aria-label="DrNote pricing plans">
      <UpgradePanel />
    </main>
  );
}
