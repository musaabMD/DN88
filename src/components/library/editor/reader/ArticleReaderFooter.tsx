"use client";

import {
  ArrowUpRight,
  BookOpen,
  CreditCard,
  FileText,
  Sparkles,
  Zap,
} from "lucide-react";
import type { StudyModeFilter } from "@/components/content/ArticleStudyModes";
import type { LibraryArticle } from "@/lib/set-content";
import {
  getArticleReferences,
  getRelatedArticles,
} from "@/lib/library/reader-data";

const STUDY_ACTIONS: Array<{
  mode: StudyModeFilter;
  label: string;
  icon: typeof FileText;
}> = [
  { mode: "questions", label: "Practice questions", icon: BookOpen },
  { mode: "flashcards", label: "Flashcards", icon: CreditCard },
  { mode: "hy", label: "High-yield", icon: Zap },
  { mode: "summary", label: "Summary", icon: FileText },
];

/**
 * Trust + navigation footer rendered after the article body: key points,
 * references, related topics, an active-recall CTA, and last-updated meta.
 */
export function ArticleReaderFooter({
  article,
  onOpenArticle,
  onStudyModeChange,
}: {
  article: LibraryArticle;
  onOpenArticle: (articleId: string) => void;
  onStudyModeChange: (mode: StudyModeFilter) => void;
}) {
  const references = getArticleReferences(article);
  const related = getRelatedArticles(article.id);

  return (
    <footer className="reader-footer">
      {article.summary ? (
        <section className="reader-keypoints">
          <div className="reader-footer-label">
            <Sparkles size={14} />
            Key points
          </div>
          <p>{article.summary}</p>
        </section>
      ) : null}

      <section className="reader-study">
        <div className="reader-footer-label">Study this topic</div>
        <div className="reader-study-actions">
          {STUDY_ACTIONS.map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              type="button"
              className="reader-study-btn"
              onClick={() => onStudyModeChange(mode)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </section>

      {related.length > 0 ? (
        <section className="reader-related">
          <div className="reader-footer-label">Related topics</div>
          <div className="reader-related-chips">
            {related.map((item) => (
              <button
                key={item.id}
                type="button"
                className="reader-related-chip"
                onClick={() => onOpenArticle(item.id)}
              >
                <span>{item.title}</span>
                <ArrowUpRight size={13} />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {references.length > 0 ? (
        <section className="reader-references">
          <div className="reader-footer-label">References</div>
          <ol className="reader-references-list">
            {references.map((ref, index) => (
              <li key={ref.id ?? ref.href}>
                <a href={ref.href} target="_blank" rel="noopener noreferrer">
                  <span className="reader-references-num">{index + 1}.</span>
                  <span className="reader-references-title">{ref.title}</span>
                  {ref.domain ? (
                    <span className="reader-references-domain">{ref.domain}</span>
                  ) : null}
                </a>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <p className="reader-updated">Last updated {article.updated}</p>
    </footer>
  );
}
