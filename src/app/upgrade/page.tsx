"use client";

import { PricingPageHeader } from "@/components/PricingPageHeader";
import { UpgradePanel } from "@/components/UpgradePanel";

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PricingPageHeader />
      <main>
        <UpgradePanel />
      </main>
    </div>
  );
}
