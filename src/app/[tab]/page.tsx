import { notFound } from "next/navigation";
import DrNoteApp from "@/components/DrNoteApp";
import { DEFAULT_TAB, isValidTab, VALID_TABS } from "@/lib/routes";

export function generateStaticParams() {
  return VALID_TABS.filter((tab) => tab !== DEFAULT_TAB).map((tab) => ({ tab }));
}

export default async function TabBrowsePage({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const { tab } = await params;
  if (!isValidTab(tab)) notFound();
  return <DrNoteApp tab={tab} />;
}
