import { LibraryArticleClient } from "@/components/LibraryArticleClient";
import { ENTITY_PLACEHOLDER_SLUG } from "@/lib/entities";

/** Static export shell — articles load from Worker API at runtime. */
export function generateStaticParams() {
  return [{ articleId: ENTITY_PLACEHOLDER_SLUG }];
}

export default async function LibraryArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;
  return <LibraryArticleClient articleId={articleId} />;
}
