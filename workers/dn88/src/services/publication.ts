import type {
  AdminPublicationStatus,
  AiReviewStatus,
  ArticleRow,
  ContentStatus,
} from "../types";

export type PublishableArticle = {
  contentStatus: ContentStatus;
  aiReviewStatus: AiReviewStatus;
  adminPublicationStatus: AdminPublicationStatus;
  hasBlockingErrors: boolean;
};

export function isPubliclyPublishable(article: PublishableArticle): boolean {
  return (
    article.contentStatus === "complete" &&
    article.aiReviewStatus === "recommended-for-approval" &&
    article.adminPublicationStatus === "approved" &&
    !article.hasBlockingErrors
  );
}

export function canApprove(article: PublishableArticle): boolean {
  return (
    article.contentStatus === "complete" &&
    article.aiReviewStatus === "recommended-for-approval" &&
    !article.hasBlockingErrors
  );
}

export function rowToPublishable(row: ArticleRow): PublishableArticle {
  return {
    contentStatus: row.content_status,
    aiReviewStatus: row.ai_review_status,
    adminPublicationStatus: row.admin_publication_status,
    hasBlockingErrors: row.has_blocking_errors === 1,
  };
}

export function publicArticleFilter(row: ArticleRow): boolean {
  return isPubliclyPublishable(rowToPublishable(row));
}
