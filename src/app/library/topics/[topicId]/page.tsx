import { TopicEntityPageClient } from "@/components/library/EntityPageClient";
import { ENTITY_PLACEHOLDER_SLUG } from "@/lib/entities";

export function generateStaticParams() {
  return [{ topicId: ENTITY_PLACEHOLDER_SLUG }];
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  return <TopicEntityPageClient topicId={topicId} />;
}
