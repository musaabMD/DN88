import { TopicEntityPageClient } from "@/components/library/EntityPageClient";
import { ENTITY_PLACEHOLDER_SLUG } from "@/lib/entities";
import { getAllTopicStaticParams } from "@/lib/specialties";

export function generateStaticParams() {
  return [{ topicId: ENTITY_PLACEHOLDER_SLUG }, ...getAllTopicStaticParams()];
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  return <TopicEntityPageClient topicId={topicId} />;
}
