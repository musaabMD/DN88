"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { UpgradePanel } from "@/components/UpgradePanel";
import { HOME_PATH } from "@/lib/routes";

export default function UpgradePage() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-50">
      <button
        type="button"
        onClick={() => router.push(HOME_PATH)}
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-700"
        aria-label="Close upgrade"
      >
        <X size={18} strokeWidth={2.5} />
      </button>
      <div className="flex-1 overflow-y-auto">
        <UpgradePanel />
      </div>
    </div>
  );
}
