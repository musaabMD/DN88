import { studySets } from "@/lib/data";
import SetDetailClient from "./SetDetailClient";

export function generateStaticParams() {
  return studySets.map((set) => ({
    examId: set.examId,
    setId: set.id,
  }));
}

export default async function SetDetailPage({
  params,
}: {
  params: Promise<{ examId: string; setId: string }>;
}) {
  const { examId, setId } = await params;
  return <SetDetailClient examId={examId} setId={setId} />;
}
