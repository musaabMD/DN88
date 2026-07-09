import type { Metadata } from "next";
import LibraryHome from "@/components/LibraryHome";

export const metadata: Metadata = {
  title: "Library — DrNote",
  description: "Browse articles and study guides on DrNote",
};

export default function LibraryPage() {
  return <LibraryHome />;
}
