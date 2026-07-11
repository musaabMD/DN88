import { LibraryArticleClient } from "@/components/LibraryArticleClient";

/** Static export shell — articles load from Worker API at runtime. */
export function generateStaticParams() {
  return [{ articleId: "_" }];
}

export default async function LibraryArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;
  return <LibraryArticleClient articleId={articleId} />;
}
