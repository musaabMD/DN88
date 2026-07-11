export type ValidationSeverity = "error" | "warning";

export type ValidationIssue = {
  code: string;
  severity: ValidationSeverity;
  message: string;
  sectionId?: string;
  sourcePath: string;
};

export type ParsedSection = {
  id: string;
  heading: string;
  bodyMarkdown: string;
  sortOrder: number;
};

export type ParsedArticle = {
  id: string;
  title: string;
  slug: string;
  specialty: string;
  subspecialty?: string;
  tags?: string[];
  updatedAt: string;
  sourcePath: string;
  sections: ParsedSection[];
  /** Markdown content before the first root-level h2, if any. */
  preambleMarkdown?: string;
};

export type ImportArticleResult =
  | { ok: true; article: ParsedArticle; warnings: ValidationIssue[] }
  | { ok: false; sourcePath: string; errors: ValidationIssue[] };

export const PARSER_VERSION = "1.0.0";
