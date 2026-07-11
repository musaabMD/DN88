import { EntityPageClient } from "@/components/library/EntityPageClient";
import { getEntityStaticParams, type EntityKind } from "@/lib/entities";

const KIND: EntityKind = "overviews";

export function generateStaticParams() {
  return getEntityStaticParams(KIND);
}

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <EntityPageClient kind={KIND} slug={slug} />;
}
