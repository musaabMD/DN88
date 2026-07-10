import type { SerializableCitation } from "@/components/tool-ui/citation";
import { LIBRARY_ARTICLES, type LibraryArticle } from "@/lib/set-content";

export type RelatedArticle = {
  id: string;
  title: string;
  subject: string;
  /** How the relation was found. */
  reason: "links-here" | "same-subject";
};

/** All text a section can contain, for scanning wiki links. */
function sectionText(article: LibraryArticle): string {
  const parts: string[] = [];
  for (const section of article.sections) {
    parts.push(section.heading, section.body, ...(section.bullets ?? []));
  }
  if (article.highYield) parts.push(article.highYield);
  if (article.summary) parts.push(article.summary);
  return parts.filter(Boolean).join("\n");
}

/** Deduplicated citations across all sections of an article. */
export function getArticleReferences(
  article: LibraryArticle
): SerializableCitation[] {
  const byHref = new Map<string, SerializableCitation>();
  for (const section of article.sections) {
    for (const citation of section.citations ?? []) {
      if (!byHref.has(citation.href)) byHref.set(citation.href, citation);
    }
  }
  for (const question of article.questions ?? []) {
    for (const citation of question.citations ?? []) {
      if (!byHref.has(citation.href)) byHref.set(citation.href, citation);
    }
  }
  return [...byHref.values()];
}

/**
 * Related topics for an article:
 *  1. Articles whose content links here via `[[This Title]]` (backlinks).
 *  2. Sibling articles sharing the same subject.
 */
export function getRelatedArticles(
  articleId: string,
  limit = 8
): RelatedArticle[] {
  const current = LIBRARY_ARTICLES.find((a) => a.id === articleId);
  if (!current) return [];

  const titleNeedle = `[[${current.title.toLowerCase()}]]`;
  const seen = new Set<string>([articleId]);
  const results: RelatedArticle[] = [];

  for (const article of LIBRARY_ARTICLES) {
    if (seen.has(article.id)) continue;
    if (sectionText(article).toLowerCase().includes(titleNeedle)) {
      results.push({
        id: article.id,
        title: article.title,
        subject: article.subject,
        reason: "links-here",
      });
      seen.add(article.id);
    }
  }

  for (const article of LIBRARY_ARTICLES) {
    if (results.length >= limit) break;
    if (seen.has(article.id)) continue;
    if (article.subject === current.subject) {
      results.push({
        id: article.id,
        title: article.title,
        subject: article.subject,
        reason: "same-subject",
      });
      seen.add(article.id);
    }
  }

  return results.slice(0, limit);
}

export type GlossaryTerm = {
  /** Lowercased term to match. */
  term: string;
  pageId: string;
  title: string;
};

let glossaryCache: GlossaryTerm[] | null = null;

/**
 * Known topic terms (published article titles) for auto-glossary linking,
 * sorted longest-first so multi-word terms win over their substrings.
 */
export function getGlossaryTerms(): GlossaryTerm[] {
  if (glossaryCache) return glossaryCache;
  const terms = LIBRARY_ARTICLES.map((article) => ({
    term: article.title.toLowerCase(),
    pageId: article.id,
    title: article.title,
  })).sort((a, b) => b.term.length - a.term.length);
  glossaryCache = terms;
  return terms;
}
