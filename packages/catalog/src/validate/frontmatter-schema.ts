import { z } from "zod";

export const frontmatterSchema = z
  .object({
    id: z.string().min(1, "id is required"),
    title: z.string().min(1, "title is required"),
    slug: z
      .string()
      .min(1, "slug is required")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case"),
    specialty: z.string().min(1, "specialty is required"),
    updated_at: z.string().min(1, "updated_at is required"),
    subspecialty: z.string().min(1).optional(),
    tags: z.array(z.string().min(1)).optional(),
    provenance: z.unknown().optional(),
    status: z.string().optional(),
    ai_status: z.string().optional(),
  })
  .strict();

export type ArticleFrontmatter = z.infer<typeof frontmatterSchema>;

export function formatZodIssues(
  issues: z.ZodIssue[],
  sourcePath: string
): Array<{
  code: string;
  severity: "error";
  message: string;
  sourcePath: string;
}> {
  return issues.map((issue) => ({
    code: `frontmatter.${issue.path.join(".") || "root"}`,
    severity: "error" as const,
    message: issue.message,
    sourcePath,
  }));
}
