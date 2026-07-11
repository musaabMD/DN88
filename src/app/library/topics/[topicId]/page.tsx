import { TopicEntityPageClient } from "@/components/library/EntityPageClient";
import { getAllTopicStaticParams } from "@/lib/specialties";

export function generateStaticParams() {
  return getAllTopicStaticParams();
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  return <TopicEntityPageClient topicId={topicId} />;
}
