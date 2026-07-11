import { notFound } from "next/navigation";
import { SpecialtyPageClient } from "@/components/library/LibraryDetailPages";
import {
  getAllSpecialtyStaticParams,
  getSpecialtyBySlug,
} from "@/lib/specialties";

export function generateStaticParams() {
  return getAllSpecialtyStaticParams().map(({ specialtySlug }) => ({
    slug: specialtySlug,
  }));
}

export default async function SpecialtyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const specialty = getSpecialtyBySlug(slug);
  if (!specialty) notFound();
  return <SpecialtyPageClient specialty={specialty} />;
}
