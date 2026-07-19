import type { MetadataRoute } from "next";
import { EXAMS } from "@/lib/exams";
import {
  FEATURES_PATH,
  HOME_PATH,
  LIBRARY_PATH,
  PRICING_PATH,
  QBANK_PATH,
  UPGRADE_PATH,
  VALID_TABS,
  examPath,
  examTabPath,
} from "@/lib/routes";

export const dynamic = "force-static";

const BASE_URL = "https://drnote.co";

function absolute(path: string): string {
  return new URL(path, BASE_URL).toString();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    HOME_PATH,
    QBANK_PATH,
    FEATURES_PATH,
    LIBRARY_PATH,
    PRICING_PATH,
    UPGRADE_PATH,
  ];

  const qbankRoutes = EXAMS.flatMap((exam) => [
    examPath(exam.id),
    ...VALID_TABS.filter((tab) => tab !== "questions" && tab !== "library").map((tab) =>
      examTabPath(exam.id, tab)
    ),
  ]);

  return [...staticRoutes, ...qbankRoutes].map((path) => ({
    url: absolute(path),
    changeFrequency: "weekly",
    priority: path === HOME_PATH ? 1 : 0.8,
  }));
}
