import type { Metadata } from "next";
import { FeaturesPageClient } from "@/components/FeaturesPage";

export const metadata: Metadata = {
  title: "Features — DrNote Qbank & Library",
  description:
    "See what DrNote Qbank and Library offer: exam practice, clinical articles, Ask AI, and study modes.",
};

export default function FeaturesPage() {
  return <FeaturesPageClient />;
}
