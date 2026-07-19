"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { UserAuthControls } from "@/components/UserAuthControls";

export function PricingPageHeader() {
  const router = useRouter();

  return (
    <AppHeader
      title="Pricing"
      headerEnd={
        <div className="flex items-center gap-1">
          <UserAuthControls compact />
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Close pricing"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" strokeWidth={2.7} />
          </button>
        </div>
      }
    />
  );
}
