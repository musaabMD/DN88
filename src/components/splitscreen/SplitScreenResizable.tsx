"use client";

import type { ReactNode } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export function SplitScreenResizable({
  pdfPanel,
  studyPanel,
}: {
  pdfPanel: ReactNode;
  studyPanel: ReactNode;
}) {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      autoSaveId="drnote-splitscreen-v2"
      className="h-full gap-3"
    >
      <ResizablePanel defaultSize={52} minSize={28} className="min-w-0">
        {pdfPanel}
      </ResizablePanel>
      <ResizableHandle withHandle className="mx-1 bg-transparent after:bg-[#CBD5E1]" />
      <ResizablePanel defaultSize={48} minSize={28} className="min-w-0">
        {studyPanel}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
