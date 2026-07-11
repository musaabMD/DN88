/** Maps DL88 directory/frontmatter specialty keys to DN88 display labels. */
export const SPECIALTY_REGISTRY: Record<string, string> = {
  cardiology: "Cardiology",
  "internal-medicine": "Internal medicine",
  endocrinology: "Endocrinology and metabolic disorders",
  pharmacology: "Pharmacology",
  neurology: "Neurology",
  psychiatry: "Psychiatry",
  surgery: "Surgery",
  "primary-care": "Primary care",
  "critical-care-medicine": "Critical care medicine",
  "respiratory-disorders": "Respiratory disorders",
  "women-s-health": "Women's health",
  nephrology: "Nephrology",
  gastroenterology: "Gastroenterology",
  hematology: "Hematology",
  oncology: "Oncology",
  rheumatology: "Rheumatology",
  dermatology: "Dermatology",
  infectious: "Infectious diseases",
  pediatrics: "Pediatrics",
};

export function resolveSpecialtyLabel(key: string): string {
  const normalized = key.trim().toLowerCase();
  return SPECIALTY_REGISTRY[normalized] ?? key;
}

export function resolveSpecialtyFromPath(sourcePath: string): string | undefined {
  const match = sourcePath.match(/content\/([^/]+)\//i);
  if (!match?.[1]) return undefined;
  return resolveSpecialtyLabel(match[1]);
}

export function computePublicSlug(
  specialty: string,
  slug: string
): string {
  const specialtyPart = specialty
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${specialtyPart}-${slug}`;
}
