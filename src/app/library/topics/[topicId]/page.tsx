import { notFound } from "next/navigation";
import { TopicPageClient } from "@/components/library/LibraryDetailPages";
import { getAllTopicStaticParams, getTopicById } from "@/lib/specialties";

export function generateStaticParams() {
  return getAllTopicStaticParams();
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const topic = getTopicById(topicId);
  if (!topic) notFound();
  return <TopicPageClient topic={topic} />;
}
