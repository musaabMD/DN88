export type ContentStatus = "scaffold" | "partial" | "complete";

export type AiReviewStatus =
  | "not-reviewed"
  | "reviewing"
  | "changes-required"
  | "recommended-for-approval"
  | "not-for-publication";

export type AdminPublicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "unpublished";

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

export function canApproveForPublication(article: PublishableArticle): boolean {
  return (
    article.contentStatus === "complete" &&
    article.aiReviewStatus === "recommended-for-approval" &&
    !article.hasBlockingErrors
  );
}
