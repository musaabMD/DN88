import { notFound } from "next/navigation";
import { LibraryArticleClient } from "@/components/LibraryArticleClient";
import { getAllArticleStaticParams, getLibraryArticleById } from "@/lib/mock-data";

export function generateStaticParams() {
  return getAllArticleStaticParams();
}

export default async function LibraryArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;
  if (!getLibraryArticleById(articleId)) {
    notFound();
  }
  return <LibraryArticleClient articleId={articleId} />;
}
