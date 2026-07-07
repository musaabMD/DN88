import { notFound } from "next/navigation";
import { SetDetailClient } from "@/components/SetDetailClient";
import { getAllSetStaticParams, getSetById } from "@/lib/mock-data";
import { isValidTab } from "@/lib/routes";

export function generateStaticParams() {
  return getAllSetStaticParams();
}

export default async function SetDetailPage({
  params,
}: {
  params: Promise<{ tab: string; setId: string }>;
}) {
  const { tab, setId } = await params;
  if (!isValidTab(tab) || !getSetById(tab, setId)) notFound();
  return <SetDetailClient tab={tab} setId={setId} />;
}
