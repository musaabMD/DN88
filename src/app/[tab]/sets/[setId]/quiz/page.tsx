import { Suspense } from "react";
import { notFound } from "next/navigation";
import { QuizSessionClient } from "@/components/QuizSessionClient";
import { getAllSetStaticParams, getSetById } from "@/lib/mock-data";
import { isValidTab } from "@/lib/routes";

export function generateStaticParams() {
  return getAllSetStaticParams();
}

export default async function QuizPage({
  params,
}: {
  params: Promise<{ tab: string; setId: string }>;
}) {
  const { tab, setId } = await params;
  if (!isValidTab(tab) || !getSetById(tab, setId)) notFound();
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <QuizSessionClient tab={tab} setId={setId} />
    </Suspense>
  );
}
