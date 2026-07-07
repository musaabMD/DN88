"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { QuizSessionPage } from "@/components/QuizSessionPage";
import type { ContentTab } from "@/lib/routes";

export function QuizSessionClient({
  tab,
  setId,
}: {
  tab: ContentTab;
  setId: string;
}) {
  const searchParams = useSearchParams();

  const sp = useMemo(() => {
    const record: Record<string, string | string[] | undefined> = {};
    searchParams.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }, [searchParams]);

  return <QuizSessionPage tab={tab} setId={setId} searchParams={sp} />;
}
