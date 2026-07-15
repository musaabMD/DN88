import { notFound } from "next/navigation";
import { LibraryAccessGate } from "@/components/LibraryAccessGate";
import { SpecialtyPageClient } from "@/components/library/LibraryDetailPages";
import {
  getAllSpecialtyStaticParams,
  getSpecialtyBySlug,
} from "@/lib/specialties";

export function generateStaticParams() {
  return getAllSpecialtyStaticParams();
}

export default async function SpecialtyPage({
  params,
}: {
  params: Promise<{ specialtySlug: string }>;
}) {
  const { specialtySlug } = await params;
  const specialty = getSpecialtyBySlug(specialtySlug);
  if (!specialty) notFound();
  return (
    <LibraryAccessGate>
      <SpecialtyPageClient specialty={specialty} />
    </LibraryAccessGate>
  );
}
