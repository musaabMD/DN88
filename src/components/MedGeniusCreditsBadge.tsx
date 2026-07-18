"use client";

import { useEffect } from "react";
import { useMedGeniusCredits } from "@/lib/medgenius/hooks";

export function MedGeniusCreditsBadge({ className = "" }: { className?: string }) {
  const { credits, refresh } = useMedGeniusCredits();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!credits) return null;

  const remaining = credits.creditsBalance;
  const plan = credits.plan.charAt(0).toUpperCase() + credits.plan.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-extrabold text-slate-600 ${className}`}
      title={`${plan} plan · ${remaining} credits · ${credits.documentsCount}/${credits.documentsLimit} docs`}
    >
      <span className="text-indigo-600">{plan}</span>
      <span className="text-slate-300">·</span>
      <span>{remaining} cr</span>
    </span>
  );
}
