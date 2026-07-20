import { Suspense } from "react";
import { SplitScreenView } from "@/components/splitscreen/SplitScreenView";

export default function SplitScreenPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#F6F7F9]" />}>
      <SplitScreenView />
    </Suspense>
  );
}
