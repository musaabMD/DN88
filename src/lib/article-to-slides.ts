import type { LibraryArticle, LibraryArticleSection } from "@/lib/set-content";

export type TitleSlide = {
  type: "title";
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export type PointsSlide = {
  type: "points";
  section?: string;
  title: string;
  points: string[];
};

export type FactSlide = {
  type: "fact";
  section?: string;
  title: string;
  stat: string;
  statLabel: string;
  note?: string;
};

export type TableSlide = {
  type: "table";
  section?: string;
  title: string;
  columns: string[];
  rows: string[][];
  caption?: string;
};

export type TwoColSlide = {
  type: "twoCol";
  section?: string;
  title: string;
  left: { heading: string; points: string[] };
  right: { heading: string; points: string[] };
};

export type ImageSlide = {
  type: "image";
  section?: string;
  title: string;
  src: string;
  alt?: string;
  caption?: string;
};

export type EndSlide = {
  type: "end";
  title: string;
  subtitle?: string;
};

export type Slide =
  | TitleSlide
  | PointsSlide
  | FactSlide
  | TableSlide
  | TwoColSlide
  | ImageSlide
  | EndSlide;

export type SlideDeck = {
  topic: string;
  specialty: string;
  slides: Slide[];
};

function stripWikiLinks(text: string): string {
  return text.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1");
}

function cleanText(text: string): string {
  return stripWikiLinks(text).replace(/\s+/g, " ").trim();
}

function splitComparisonBullets(bullets: string[]): TwoColSlide["left"][] | null {
  const t1 = bullets.filter((b) => /^T1DM/i.test(b.trim()));
  const t2 = bullets.filter((b) => /^T2DM/i.test(b.trim()));
  if (t1.length === 0 || t2.length === 0) return null;
  return [
    { heading: "Type 1", points: t1.map(cleanText) },
    { heading: "Type 2", points: t2.map(cleanText) },
  ];
}

function sectionToSlides(section: LibraryArticleSection): Slide[] {
  const heading = section.heading;
  const body = section.body ? cleanText(section.body) : "";
  const bullets = (section.bullets ?? []).map(cleanText).filter(Boolean);

  if (
    section.id === "overview" ||
    section.heading.toLowerCase().includes(" vs ")
  ) {
    const cols = splitComparisonBullets(bullets);
    if (cols) {
      return [
        {
          type: "twoCol",
          section: heading,
          title: heading,
          left: cols[0]!,
          right: cols[1]!,
        },
      ];
    }
  }

  const points: string[] = [];
  if (body) points.push(body);
  points.push(...bullets);

  if (points.length === 0) return [];

  if (points.length === 1 && points[0]!.length < 80) {
    return [
      {
        type: "fact",
        section: heading,
        title: heading,
        stat: points[0]!,
        statLabel: "Key point",
      },
    ];
  }

  return [
    {
      type: "points",
      section: heading,
      title: heading,
      points: points.slice(0, 6),
    },
  ];
}

export function articleToSlideDeck(article: LibraryArticle): SlideDeck {
  const slides: Slide[] = [
    {
      type: "title",
      eyebrow: "DrNote Library",
      title: article.title,
      subtitle:
        article.summary ??
        `${article.subject} · ${article.readMinutes} min read`,
    },
  ];

  for (const section of article.sections) {
    slides.push(...sectionToSlides(section));
  }

  if (article.highYield) {
    const hy = cleanText(article.highYield);
    const statMatch = hy.match(/(\d[\d.,]*%?|\d+\s*[–-]\s*\d+%?)/);
    if (statMatch) {
      slides.push({
        type: "fact",
        section: "High yield",
        title: "High yield pearls",
        stat: statMatch[0]!,
        statLabel: "Clinical highlight",
        note: hy,
      });
    } else {
      slides.push({
        type: "points",
        section: "High yield",
        title: "High yield pearls",
        points: hy.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 5),
      });
    }
  }

  slides.push({
    type: "end",
    title: "End of summary",
    subtitle:
      "Return to Read view in DrNote for references, dosing details, and full notes.",
  });

  return {
    topic: article.title,
    specialty: article.subject,
    slides,
  };
}
