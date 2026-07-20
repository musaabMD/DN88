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
      autoSaveId="drnote-splitscreen"
      className="h-full rounded-xl border border-[#E5E5E5] bg-white shadow-sm"
    >
      <ResizablePanel defaultSize={50} minSize={30}>
        {pdfPanel}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50} minSize={30}>
        <div className="flex h-full min-h-0 flex-col">{studyPanel}</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
