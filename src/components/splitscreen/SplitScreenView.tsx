"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DocumentPdfViewer } from "@/components/medgenius/DocumentPdfViewer";
import { HomeLocaleProvider } from "@/components/home/HomeLocaleProvider";
import { MedGeniusCreditsProvider } from "@/lib/medgenius/credits-context";
import { getDemoFilesForExam } from "@/lib/medgenius/demo-files";
import { useExamDocuments } from "@/lib/medgenius/home-data";
import { useClerkEnabled } from "@/hooks/useClerkEnabled";

const SplitScreenStudyPanel = dynamic(
  () =>
    import("@/components/splitscreen/SplitScreenStudyPanel").then(
      (mod) => mod.SplitScreenStudyPanel
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center p-6 text-sm font-semibold text-[#777]">
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
      <div className="flex h-full gap-3 rounded-xl border border-[#E5E5E5] bg-white p-3 shadow-sm">
        <div className="flex flex-1 items-center justify-center rounded-lg bg-[#F6F7F9] text-sm font-semibold text-[#777]">
          Loading panels…
        </div>
        <div className="flex flex-1 items-center justify-center rounded-lg bg-[#F6F7F9] text-sm font-semibold text-[#777]">
          Loading panels…
        </div>
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
        <div className="h-[100dvh] bg-[#F6F7F9] text-slate-900 [color-scheme:light]">
          <SplitScreenInner />
        </div>
      </MedGeniusCreditsProvider>
    </HomeLocaleProvider>
  );
}

function SplitScreenInner() {
  const searchParams = useSearchParams();
  const clerkEnabled = useClerkEnabled();
  const [mounted, setMounted] = useState(false);
  const examId = searchParams.get("exam") ?? "smle";
  const docParam = searchParams.get("doc");
  const exam = EXAMS.find((item) => item.id === examId) ?? EXAMS[0];
  const { files: liveFiles } = useExamDocuments(exam.id, 0);
  const demoFiles = useMemo(() => getDemoFilesForExam(exam.id), [exam.id]);

  useEffect(() => {
    setMounted(true);
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
      documentId: docParam ?? undefined,
    };
  }, [docParam, demoFiles, liveFiles]);

  const pdfPanel = (
    <div className="flex h-full flex-col">
      <div className="border-b border-[#E5E5E5] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-[#777]">
        Original PDF
      </div>
      <div className="min-h-0 flex-1">
        {file?.documentId && clerkEnabled ? (
          <DocumentPdfViewer documentId={file.documentId} pageCount={file.pages} />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm font-semibold text-[#777]">
            {file ? (
              <>
                Sign in and upload a PDF, or open with{" "}
                <code className="rounded bg-[#F6F7F9] px-1 py-0.5 text-xs">?doc=&lt;documentId&gt;</code>
              </>
            ) : (
              "No demo file available"
            )}
          </div>
        )}
      </div>
    </div>
  );

  const studyPanel =
    !mounted ? (
      <div className="flex h-full items-center justify-center p-6 text-sm font-semibold text-[#777]">
        Loading study panel…
      </div>
    ) : file && exam ? (
      <SplitScreenStudyPanel file={file} exam={exam} />
    ) : (
      <div className="flex h-full items-center justify-center p-6 text-sm font-semibold text-[#777]">
        Load a file to show study tabs
      </div>
    );

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-[#E5E5E5] bg-white px-4 py-2">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#AFAFAF]">Split screen test</p>
          <h1 className="text-sm font-black text-[#3C3C3C]">{file?.name ?? "No file selected"}</h1>
        </div>
        <Link
          href="/qbank/smle/"
          className="rounded-lg border border-[#E5E5E5] px-3 py-1.5 text-xs font-extrabold text-[#777]"
        >
          Back to SMLE
        </Link>
      </header>

      <div className="min-h-0 flex-1 p-3">
        {mounted ? (
          <ResizablePanels pdfPanel={pdfPanel} studyPanel={studyPanel} />
        ) : (
          <div className="flex h-full gap-3 rounded-xl border border-[#E5E5E5] bg-white p-3 shadow-sm">
            <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-[#E5E5E5]">{pdfPanel}</div>
            <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-[#E5E5E5]">{studyPanel}</div>
          </div>
        )}
      </div>
    </div>
  );
}
