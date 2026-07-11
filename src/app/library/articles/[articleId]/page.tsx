import { LibraryArticleClient } from "@/components/LibraryArticleClient";
import { getAllResolvableArticleSlugs } from "@/lib/entities";

export function generateStaticParams() {
  return getAllResolvableArticleSlugs().map((articleId) => ({ articleId }));
}

export default async function LibraryArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;
  return <LibraryArticleClient articleId={articleId} />;
}
