"use client";

import { ParsedMarkdownViewer } from "@/components/splitscreen/ParsedMarkdownViewer";
import { SplitScreenPanelShell } from "@/components/splitscreen/SplitScreenPanelShell";
import type { HomeReadPage } from "@/lib/medgenius/home-data";

type SplitScreenPdfPanelProps = {
  fileId: string;
  fileName: string;
  pages: number;
  color: string;
  documentId?: string;
  readPages: HomeReadPage[];
  rawMarkdown?: string | null;
  markdownLoading?: boolean;
  onAskSelection?: (text: string) => void;
};

export function SplitScreenPdfPanel({
  fileName,
  pages,
  color,
  readPages,
  rawMarkdown,
  markdownLoading,
  onAskSelection,
}: SplitScreenPdfPanelProps) {
  return (
    <SplitScreenPanelShell expandOnlyHeader accent={color}>
      <ParsedMarkdownViewer
        fileName={fileName}
        pageCount={pages}
        rawMarkdown={rawMarkdown}
        readPages={readPages}
        loading={markdownLoading}
        onAskSelection={onAskSelection}
      />
    </SplitScreenPanelShell>
  );
}
