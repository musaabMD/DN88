"use client";

import Link from "next/link";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { UpgradePanel } from "@/components/UpgradePanel";
import { UserAuthControls } from "@/components/UserAuthControls";
import { HOME_PATH, PRICING_PATH } from "@/lib/routes";

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href={HOME_PATH} className="flex min-w-0 items-center">
            <DrNoteLogo showWordmark forceWordmark />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={PRICING_PATH}
              className="hidden text-sm font-bold text-slate-600 transition-colors hover:text-slate-900 sm:inline-flex"
            >
              Pricing
            </Link>
            <UserAuthControls compact />
          </div>
        </div>
      </header>
      <main>
        <UpgradePanel />
      </main>
    </div>
  );
}
