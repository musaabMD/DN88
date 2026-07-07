import { notFound } from "next/navigation";
import { SetResultsPage } from "@/components/SetResultsPage";
import { getAllSetStaticParams, getSetById } from "@/lib/mock-data";
import { isValidTab } from "@/lib/routes";

export function generateStaticParams() {
  return getAllSetStaticParams();
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ tab: string; setId: string }>;
}) {
  const { tab, setId } = await params;
  if (!isValidTab(tab) || !getSetById(tab, setId)) notFound();
  return <SetResultsPage tab={tab} setId={setId} />;
}
