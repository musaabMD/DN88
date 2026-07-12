import type { Metadata } from "next";
import { Suspense } from "react";
import LibraryHome from "@/components/LibraryHome";

export const metadata: Metadata = {
  title: "Library — DrNote",
  description: "Browse articles and study guides on DrNote",
};

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LibraryHome />
    </Suspense>
  );
}
