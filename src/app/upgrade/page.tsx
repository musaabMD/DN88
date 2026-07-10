"use client";

import { useRouter } from "next/navigation";
import { Crown, X } from "lucide-react";
import { UpgradePanel } from "@/components/UpgradePanel";
import { HOME_PATH } from "@/lib/routes";

export default function UpgradePage() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 h-14 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Crown size={18} strokeWidth={2.5} style={{ color: "#a855f7" }} />
          <span className="font-black text-slate-900 text-base">Upgrade</span>
        </div>
        <button
          type="button"
          onClick={() => router.push(HOME_PATH)}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "#f1f5f9", border: "2px solid #e2e8f0" }}
          aria-label="Close upgrade"
        >
          <X size={15} strokeWidth={2.5} className="text-slate-500" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <UpgradePanel />
      </div>
    </div>
  );
}
