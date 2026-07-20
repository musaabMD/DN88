"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SplitScreenPdfPanel } from "@/components/splitscreen/SplitScreenPdfPanel";
import { SplitScreenPanelShell } from "@/components/splitscreen/SplitScreenPanelShell";
import { SS } from "@/components/splitscreen/splitscreen-theme";
import { HomeLocaleProvider, useHomeLocale } from "@/components/home/HomeLocaleProvider";
import { MedGeniusCreditsProvider } from "@/lib/medgenius/credits-context";
import { getDemoFilesForExam } from "@/lib/medgenius/demo-files";
import { useExamDocuments } from "@/lib/medgenius/home-data";

const SplitScreenStudyPanel = dynamic(
  () =>
    import("@/components/splitscreen/SplitScreenStudyPanel").then(
      (mod) => mod.SplitScreenStudyPanel
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center p-6 text-sm font-semibold" style={{ color: SS.sub }}>
        Loading study panel…
      </div>
    ),
  }
);

const ResizablePanels = dynamic(
  () => import("@/components/splitscreen/SplitScreenResizable").then((mod) => mod.SplitScreenResizable),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-white" style={{ borderColor: SS.panelBorder }} />
        <div className="rounded-2xl border bg-white" style={{ borderColor: SS.panelBorder }} />
      </div>
    ),
  }
);

const EXAMS = [
  { id: "smle", code: "SMLE", name: "Saudi Medical Licensing", from: "#FF6B6B", to: "#E11D48", tags: ["medical", "smle", "doctor"] },
];

export function SplitScreenView() {
  return (
    <HomeLocaleProvider>
      <MedGeniusCreditsProvider>
        <div
          className="h-[100dvh] [color-scheme:light]"
          style={{ background: SS.pageBg, color: SS.ink }}
        >
          <SplitScreenInner />
        </div>
      </MedGeniusCreditsProvider>
    </HomeLocaleProvider>
  );
}

function SplitScreenInner() {
  const searchParams = useSearchParams();
  const { content } = useHomeLocale();
  const [mounted, setMounted] = useState(false);
  const [pendingAskQuote, setPendingAskQuote] = useState<string | null>(null);
  const examId = searchParams.get("exam") ?? "smle";
  const docParam = searchParams.get("doc");
  const exam = EXAMS.find((item) => item.id === examId) ?? EXAMS[0];
  const { files: liveFiles } = useExamDocuments(exam.id, 0);
  const demoFiles = useMemo(() => getDemoFilesForExam(exam.id), [exam.id]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePendingAskHandled = useCallback(() => {
    setPendingAskQuote(null);
  }, []);

  const handleAskFromPdf = useCallback((text: string) => {
    setPendingAskQuote(text);
  }, []);

  const file = useMemo(() => {
    if (docParam) {
      const live = liveFiles.find((item) => item.documentId === docParam || item.id === docParam);
      if (live) return live;
    }
    if (liveFiles[0]) return liveFiles[0];
    const demo = demoFiles[0];
    if (!demo) return null;
    return {
      id: demo.id,
      name: demo.name,
      author: demo.author,
      pages: demo.pages,
      color: demo.color,
      votes: demo.votes,
      documentId: undefined,
    };
  }, [docParam, demoFiles, liveFiles]);

  const pdfPanel =
    file ? (
      <SplitScreenPdfPanel
        fileId={file.id}
        fileName={file.name}
        pages={file.pages}
        color={file.color}
        documentId={file.documentId}
        readPages={content.readPages}
        onAskSelection={handleAskFromPdf}
      />
    ) : (
      <SplitScreenPanelShell title="Original PDF" subtitle="No file" accent="#94A3B8">
        <div className="flex h-full items-center justify-center p-6 text-sm font-semibold" style={{ color: SS.sub }}>
          No demo file available
        </div>
      </SplitScreenPanelShell>
    );

  const studyShellStyle = {
    borderColor: SS.panelBorder,
    boxShadow: SS.panelShadow,
  };
  const studyShellClass =
    "flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-white";

  const studyPanel = !mounted ? (
    <div className={studyShellClass} style={studyShellStyle}>
      <div className="flex h-full items-center justify-center p-6 text-sm font-semibold" style={{ color: SS.sub }}>
        Loading study panel…
      </div>
    </div>
  ) : file && exam ? (
    <div className={studyShellClass} style={studyShellStyle}>
      <SplitScreenStudyPanel
        file={file}
        exam={exam}
        pendingAskQuote={pendingAskQuote}
        onPendingAskHandled={handlePendingAskHandled}
      />
    </div>
  ) : (
    <div className={studyShellClass} style={studyShellStyle}>
      <div className="flex h-full items-center justify-center p-6 text-sm font-semibold" style={{ color: SS.sub }}>
        Load a file to show study tabs
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <header
        className="flex shrink-0 items-center justify-between border-b bg-white px-4 py-3"
        style={{ borderColor: SS.panelBorder }}
      >
        <div>
          <p
            className="text-[10px] font-extrabold uppercase tracking-[0.18em]"
            style={{ color: SS.faint }}
          >
            Split screen
          </p>
          <h1 className="text-base font-black tracking-tight" style={{ color: SS.ink }}>
            {file?.name ?? "Pick a file"}
          </h1>
        </div>
        <Link
          href="/qbank/smle/"
          className="rounded-xl border bg-white px-3 py-2 text-xs font-extrabold shadow-sm transition hover:opacity-90"
          style={{ borderColor: SS.panelBorder, color: SS.sub }}
        >
          Back to SMLE
        </Link>
      </header>

      <div className="min-h-0 flex-1 p-3">
        {mounted ? (
          <ResizablePanels pdfPanel={pdfPanel} studyPanel={studyPanel} />
        ) : (
          <div className="grid h-full grid-cols-2 gap-3">
            {pdfPanel}
            {studyPanel}
          </div>
        )}
      </div>
    </div>
  );
}
