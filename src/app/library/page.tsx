import type { Metadata } from "next";
import { LibraryAccessGate } from "@/components/LibraryAccessGate";
import LibraryHome from "@/components/LibraryHome";

export const metadata: Metadata = {
  title: "Library — DrNote",
  description: "Browse articles and study guides on DrNote",
};

export default function LibraryPage() {
  return (
    <LibraryAccessGate>
      <LibraryHome />
    </LibraryAccessGate>
  );
}
