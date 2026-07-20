"use client";

import { DocumentPdfViewer } from "@/components/medgenius/DocumentPdfViewer";
import { DemoPdfViewer } from "@/components/splitscreen/DemoPdfViewer";
import { SplitScreenPanelShell } from "@/components/splitscreen/SplitScreenPanelShell";
import { useClerkEnabled } from "@/hooks/useClerkEnabled";
import type { HomeReadPage } from "@/lib/medgenius/home-data";

type SplitScreenPdfPanelProps = {
  fileId: string;
  fileName: string;
  pages: number;
  color: string;
  documentId?: string;
  readPages: HomeReadPage[];
  onAskSelection?: (text: string) => void;
};

export function SplitScreenPdfPanel({
  fileId,
  fileName,
  pages,
  color,
  documentId,
  readPages,
  onAskSelection,
}: SplitScreenPdfPanelProps) {
  const clerkEnabled = useClerkEnabled();
  const canShowLivePdf = Boolean(documentId && clerkEnabled);

  return (
    <SplitScreenPanelShell
      title={fileName}
      subtitle="Original PDF"
      accent={color}
    >
      {canShowLivePdf && documentId ? (
        <DocumentPdfViewer
          documentId={documentId}
          pageCount={pages}
          onAskSelection={onAskSelection}
          showAnnotationToolbar
        />
      ) : (
        <DemoPdfViewer
          fileId={fileId}
          fileName={fileName}
          pageCount={pages}
          readPages={readPages}
          onAskSelection={onAskSelection}
        />
      )}
    </SplitScreenPanelShell>
  );
}
