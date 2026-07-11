import { LibraryArticleClient } from "@/components/LibraryArticleClient";
import { getPublishedArticleStaticParams } from "@/lib/entities";

export function generateStaticParams() {
  return getPublishedArticleStaticParams();
}

export default async function LibraryArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;
  return <LibraryArticleClient articleId={articleId} />;
}
