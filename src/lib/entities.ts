/**
 * Medical knowledge graph — entities, relationships, and canonical URLs.
 *
 * Articles are synced from an external catalog (see scripts/refresh-catalog.mjs),
 * not from the DN88 worker (which handles auth/billing only).
 */

import { LIBRARY_ARTICLES } from "@/lib/catalog-bundle";
import type { LibraryArticle } from "@/lib/set-content";
import {
  ALL_SPECIALTY_TOPICS,
  getTopicById,
  type MedicalSpecialty,
  type SpecialtyTopic,
} from "@/lib/specialties";

export type EntityKind =
  | "conditions"
  | "medications"
  | "procedures"
  | "assessments"
  | "overviews";

/** Shared static shell; real slug is resolved client-side from the URL path. */
export const ENTITY_PLACEHOLDER_SLUG = "_";

const ENTITY_KINDS: EntityKind[] = [
  "conditions",
  "medications",
  "procedures",
  "assessments",
  "overviews",
];

export type EntityNode = {
  slug: string;
  kind: EntityKind;
  title: string;
  /** Specialties that cover this entity (clinical perspectives). */
  specialties: MedicalSpecialty[];
  /** Published article id when content exists. */
  articleId?: string;
};

/** Slugify canonical medical terminology for URLs. */
export function entitySlugFromTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Strip assessment/overview prefixes for slug generation. */
export function entitySlugFromTopicTitle(title: string): string {
  const assessment = title.match(/^Assessment of (.+)$/i);
  if (assessment?.[1]) return entitySlugFromTitle(assessment[1]);

  const overview = title.match(/^Overview of (.+)$/i);
  if (overview?.[1]) return entitySlugFromTitle(overview[1]);

  return entitySlugFromTitle(title);
}

export function classifyEntityKind(
  title: string,
  subject?: string
): EntityKind {
  if (/^Assessment of /i.test(title)) return "assessments";
  if (/^Overview of /i.test(title)) return "overviews";
  if (subject === "Pharmacology") return "medications";
  return "conditions";
}

export function entityKindLabel(kind: EntityKind): string {
  switch (kind) {
    case "conditions":
      return "Conditions";
    case "medications":
      return "Medications";
    case "procedures":
      return "Procedures";
    case "assessments":
      return "Assessments";
    case "overviews":
      return "Overviews";
  }
}

export function entityPath(kind: EntityKind, slug: string): string {
  return `/${kind}/${slug}/`;
}

export function entityPathForTopic(topic: SpecialtyTopic): string {
  const kind = classifyEntityKind(topic.title);
  const slug = entitySlugFromTopicTitle(topic.title);
  return entityPath(kind, slug);
}

export function entityPathForArticle(
  article: Pick<LibraryArticle, "title" | "subject">
): string {
  const kind = classifyEntityKind(article.title, article.subject);
  const slug = entitySlugFromTopicTitle(article.title);
  return entityPath(kind, slug);
}

/** Resolve a published article by legacy id, entity slug, or title slug. */
export function resolveLibraryArticle(
  slugOrId: string
): LibraryArticle | undefined {
  const direct = LIBRARY_ARTICLES.find((a) => a.id === slugOrId);
  if (direct) return direct;

  const normalized = slugOrId.toLowerCase();
  return LIBRARY_ARTICLES.find((article) => {
    if (article.id.toLowerCase() === normalized) return true;
    if (entitySlugFromTopicTitle(article.title) === normalized) return true;
    if (entitySlugFromTitle(article.title) === normalized) return true;
    return false;
  });
}

function buildEntityRegistry(): Map<string, EntityNode> {
  const registry = new Map<string, EntityNode>();

  for (const topic of ALL_SPECIALTY_TOPICS) {
    const kind = classifyEntityKind(topic.title);
    const slug = entitySlugFromTopicTitle(topic.title);
    const key = `${kind}:${slug}`;

    const existing = registry.get(key);
    if (existing) {
      if (!existing.specialties.includes(topic.specialty)) {
        existing.specialties.push(topic.specialty);
      }
      continue;
    }

    registry.set(key, {
      slug,
      kind,
      title: topic.title,
      specialties: [topic.specialty],
    });
  }

  for (const article of LIBRARY_ARTICLES) {
    const kind = classifyEntityKind(article.title, article.subject);
    const slug = entitySlugFromTopicTitle(article.title);
    const key = `${kind}:${slug}`;

    const existing = registry.get(key);
    if (existing) {
      existing.articleId = article.id;
      if (!existing.specialties.includes(article.subject as MedicalSpecialty)) {
        existing.specialties.push(article.subject as MedicalSpecialty);
      }
      continue;
    }

    registry.set(key, {
      slug,
      kind,
      title: article.title,
      specialties: [article.subject as MedicalSpecialty],
      articleId: article.id,
    });
  }

  return registry;
}

const ENTITY_REGISTRY = buildEntityRegistry();

export function getEntity(
  kind: EntityKind,
  slug: string
): EntityNode | undefined {
  return ENTITY_REGISTRY.get(`${kind}:${slug.toLowerCase()}`);
}

export function getAllEntities(kind?: EntityKind): EntityNode[] {
  const nodes = [...ENTITY_REGISTRY.values()];
  return kind ? nodes.filter((n) => n.kind === kind) : nodes;
}

/** Slug segment from a canonical entity pathname, e.g. /conditions/dka/ → dka. */
export function entitySlugFromPathname(
  pathname: string,
  kind: EntityKind
): string {
  const prefix = `/${kind}/`;
  if (!pathname.startsWith(prefix)) return "";
  const rest = pathname.slice(prefix.length).replace(/\/$/, "");
  return rest.split("/")[0] ?? "";
}

export function getPublishedEntityStaticParams(
  kind: EntityKind
): Array<{ slug: string }> {
  return getAllEntities(kind)
    .filter((entity) => entity.articleId)
    .map((entity) => ({ slug: entity.slug }));
}

export function getEntityStaticParams(
  kind: EntityKind
): Array<{ slug: string }> {
  const published = getPublishedEntityStaticParams(kind);
  const slugs = new Set(published.map((entry) => entry.slug));
  slugs.add(ENTITY_PLACEHOLDER_SLUG);
  return [...slugs].map((slug) => ({ slug }));
}

/** Cloudflare Pages splat rewrites — serve placeholder shells for unpublished entities. */
export function getEntitySplatRewrites(): Array<{ from: string; to: string }> {
  return ENTITY_KINDS.map((kind) => ({
    from: `/${kind}/*`,
    to: `/${kind}/${ENTITY_PLACEHOLDER_SLUG}/`,
  }));
}

/** Map legacy /library/topics/{topicId} to canonical entity path. */
export function canonicalPathForTopicId(topicId: string): string | undefined {
  const topic = getTopicById(topicId);
  if (!topic) return undefined;
  return entityPathForTopic(topic);
}

export function getTopicRedirectMap(): Array<{ from: string; to: string }> {
  return ALL_SPECIALTY_TOPICS.map((topic) => ({
    from: `/library/topics/${topic.id}`,
    to: entityPathForTopic(topic),
  }));
}

export function getArticleRedirectMap(): Array<{ from: string; to: string }> {
  return LIBRARY_ARTICLES.map((article) => ({
    from: `/library/articles/${article.id}`,
    to: entityPathForArticle(article),
  }));
}

/** Legacy article ids that should pre-render at /library/articles/{id}. */
export function getPublishedArticleStaticParams(): Array<{ articleId: string }> {
  const ids = new Set<string>();
  for (const article of LIBRARY_ARTICLES) {
    ids.add(article.id);
    ids.add(entitySlugFromTopicTitle(article.title));
  }
  return [...ids].map((articleId) => ({ articleId }));
}
