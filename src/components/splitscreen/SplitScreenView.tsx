"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SplitScreenPdfPanel } from "@/components/splitscreen/SplitScreenPdfPanel";
import { SplitScreenPanelShell } from "@/components/splitscreen/SplitScreenPanelShell";
import {
  SplitScreenMobileToggle,
  type SplitScreenMobilePane,
} from "@/components/splitscreen/SplitScreenMobileToggle";
import { SplitScreenUploadScreen } from "@/components/splitscreen/SplitScreenUploadScreen";
import { SS } from "@/components/splitscreen/splitscreen-theme";
import { HomeLocaleProvider, useHomeLocale } from "@/components/home/HomeLocaleProvider";
import { MedGeniusCreditsProvider, useMedGeniusCreditsContext } from "@/lib/medgenius/credits-context";
import { getDemoFilesForExam, isDemoFilesForced } from "@/lib/medgenius/demo-files";
import { useDocumentStudy, useExamDocuments } from "@/lib/medgenius/home-data";
import {
  isLocalSplitScreenDocumentId,
  loadLocalSplitScreenDocument,
  type LocalSplitScreenDocument,
} from "@/lib/splitscreen/local-documents";

const MOBILE_MAX_WIDTH = 767;

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
      <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-2xl border bg-white" style={{ borderColor: SS.panelBorder }} />
        <div className="hidden rounded-2xl border bg-white md:block" style={{ borderColor: SS.panelBorder }} />
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { content } = useHomeLocale();
  const { credits } = useMedGeniusCreditsContext();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobilePane, setMobilePane] = useState<SplitScreenMobilePane>("pdf");
  const [pendingAskQuote, setPendingAskQuote] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [localDocument, setLocalDocument] = useState<LocalSplitScreenDocument | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const examId = searchParams.get("exam") ?? "smle";
  const docParam = searchParams.get("doc");
  const useDemo = isDemoFilesForced() || searchParams.get("demo") === "1";
  const exam = EXAMS.find((item) => item.id === examId) ?? EXAMS[0];
  const { files: liveFiles } = useExamDocuments(exam.id, refreshKey);
  const demoFiles = useMemo(() => getDemoFilesForExam(exam.id), [exam.id]);

  useEffect(() => {
    if (!isLocalSplitScreenDocumentId(docParam)) {
      setLocalDocument(null);
      setLocalLoading(false);
      return;
    }

    let cancelled = false;
    setLocalLoading(true);
    void loadLocalSplitScreenDocument(docParam)
      .then((document) => {
        if (!cancelled) setLocalDocument(document);
      })
      .catch(() => {
        if (!cancelled) setLocalDocument(null);
      })
      .finally(() => {
        if (!cancelled) setLocalLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [docParam]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const handlePendingAskHandled = useCallback(() => {
    setPendingAskQuote(null);
  }, []);

  const handleAskFromPdf = useCallback((text: string) => {
    setPendingAskQuote(text);
    setMobilePane("study");
  }, []);

  const handleUploaded = useCallback(
    (documentId: string) => {
      setRefreshKey((value) => value + 1);
      router.replace(`/splitscreen?exam=${encodeURIComponent(examId)}&doc=${encodeURIComponent(documentId)}`);
    },
    [examId, router]
  );

  const file = useMemo(() => {
    if (localDocument) {
      return {
        id: localDocument.id,
        name: localDocument.name,
        author: "Local extraction",
        pages: localDocument.pageCount,
        color: localDocument.color,
        votes: { today: 0, week: 0, month: 0, all: 0 },
        documentId: undefined,
        localQuestions: localDocument.questions,
        localReadPages: localDocument.readPages,
        localRawMarkdown: localDocument.rawMarkdown,
        localFlashcards: localDocument.flashcards,
        localSummaries: localDocument.summaries,
      };
    }
    if (docParam) {
      const live = liveFiles.find((item) => item.documentId === docParam || item.id === docParam);
      if (live) return live;
    }
    if (useDemo) {
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
    }
    return null;
  }, [docParam, demoFiles, liveFiles, localDocument, useDemo]);

  const documentStudy = useDocumentStudy(file?.documentId);
  const testMode = Boolean(credits?.testMode);

  if (mounted && localLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm font-semibold" style={{ color: SS.sub }}>
        Loading extracted file…
      </div>
    );
  }

  if (mounted && !file) {
    return (
      <SplitScreenUploadScreen
        examId={examId}
        testMode={testMode}
        onUploaded={handleUploaded}
      />
    );
  }

  const pdfPanel =
    file ? (
      <SplitScreenPdfPanel
        fileId={file.id}
        fileName={file.name}
        pages={file.pages}
        color={file.color}
        documentId={file.documentId}
        readPages={localDocument?.readPages ?? documentStudy.readPages ?? content.readPages}
        rawMarkdown={localDocument?.rawMarkdown ?? documentStudy.rawMarkdown}
        markdownLoading={Boolean(file.documentId && documentStudy.loading)}
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

  const panelArea = !mounted ? (
    <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-2">
      {pdfPanel}
      <div className="hidden md:block">{studyPanel}</div>
    </div>
  ) : isMobile ? (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <SplitScreenMobileToggle pane={mobilePane} onPaneChange={setMobilePane} />
      <div className="min-h-0 flex-1">
        {mobilePane === "pdf" ? pdfPanel : studyPanel}
      </div>
    </div>
  ) : (
    <ResizablePanels pdfPanel={pdfPanel} studyPanel={studyPanel} />
  );

  return (
    <div className="flex h-full flex-col">
      <header
        className="flex shrink-0 items-center justify-between gap-2 border-b bg-white px-3 py-2.5 sm:px-4 sm:py-3"
        style={{ borderColor: SS.panelBorder }}
      >
        <div className="min-w-0 flex-1">
          <p
            className="text-[10px] font-extrabold uppercase tracking-[0.18em]"
            style={{ color: SS.faint }}
          >
            {isMobile ? (mobilePane === "pdf" ? "PDF" : "Study") : "Split screen"}
          </p>
          <h1 className="truncate text-sm font-black tracking-tight sm:text-base" style={{ color: SS.ink }}>
            {file?.name ?? "Pick a file"}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/splitscreen?exam=${encodeURIComponent(examId)}`}
            className="rounded-xl border bg-white px-2.5 py-2 text-[11px] font-extrabold shadow-sm transition hover:opacity-90 sm:px-3 sm:text-xs"
            style={{ borderColor: SS.panelBorder, color: SS.sub }}
          >
            Upload
          </Link>
          <Link
            href="/qbank/smle/"
            className="rounded-xl border bg-white px-2.5 py-2 text-[11px] font-extrabold shadow-sm transition hover:opacity-90 sm:px-3 sm:text-xs"
            style={{ borderColor: SS.panelBorder, color: SS.sub }}
          >
            Back
          </Link>
        </div>
      </header>

      <div className="min-h-0 flex-1 p-2 sm:p-3">{panelArea}</div>
    </div>
  );
}
