"use client";

import { SignInButton } from "@clerk/clerk-react";
import {
  FileText,
  Loader2,
  Play,
  RefreshCw,
  Upload,
  Wand2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EXAMPLE_EXTRACTED_QUESTION,
  fetchRagHealth,
  fetchRagRun,
  triggerRagTask,
  type RagHealth,
} from "@/lib/rag/api";
import { renderPdfPages, type RenderedPdfPage } from "@/lib/rag/render-pdf-pages";
import type {
  CanonicalQuestion,
  DocumentExtractionResult,
  PageRegion,
} from "@/lib/rag/schemas";
import { getClerkToken, isClerkSignedIn } from "@/lib/clerk-token";
import { useClerkEnabled, useClientMounted } from "@/hooks/useClerkEnabled";

const C = {
  bg: "#F3F5F4",
  ink: "#1F2A24",
  sub: "#5C6B63",
  line: "#D5DDD8",
  panel: "#FFFFFF",
  accent: "#0F6E56",
  accentSoft: "#E3F2EC",
  warn: "#8A5A00",
  warnSoft: "#FFF4D6",
  danger: "#9B2C2C",
  reconstructed: "#1D4F91",
  generated: "#7A3E12",
} as const;

type VersionTab = "source" | "normalized" | "quizReady";

function originLabel(origin: CanonicalQuestion["origin"]) {
  if (origin === "extracted") return { text: "Extracted", color: C.accent };
  if (origin === "reconstructed")
    return { text: "Reconstructed", color: C.reconstructed };
  return { text: "Generated", color: C.generated };
}

function RegionOverlay({
  regions,
  selectedId,
  onSelect,
}: {
  regions: PageRegion[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {regions.map((region) => {
        const selected = region.id === selectedId;
        return (
          <button
            key={region.id}
            type="button"
            className="pointer-events-auto absolute border-2 transition-colors"
            style={{
              left: `${region.boundingBox.x}%`,
              top: `${region.boundingBox.y}%`,
              width: `${region.boundingBox.width}%`,
              height: `${region.boundingBox.height}%`,
              borderColor: selected ? C.accent : "rgba(15,110,86,0.45)",
              background: selected
                ? "rgba(15,110,86,0.12)"
                : "rgba(15,110,86,0.04)",
            }}
            title={`${region.type} (${Math.round(region.confidence * 100)}%)`}
            onClick={() => onSelect(region.id)}
          />
        );
      })}
    </div>
  );
}

export function RagLabView() {
  const mounted = useClientMounted();
  const clerkEnabled = useClerkEnabled();
  const signedIn = mounted && clerkEnabled && isClerkSignedIn();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<RenderedPdfPage[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState<string | null>(null);
  const [maxPages, setMaxPages] = useState(3);
  const [health, setHealth] = useState<RagHealth | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentExtractionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [versionTab, setVersionTab] = useState<VersionTab>("source");
  const [useExample, setUseExample] = useState(true);

  const documentId = useMemo(
    () => `doc_${file?.name?.replace(/\W+/g, "_").slice(0, 40) || "demo"}`,
    [file],
  );

  const questions = useMemo(() => {
    if (result?.questions?.length) return result.questions;
    if (useExample) return [EXAMPLE_EXTRACTED_QUESTION];
    return [];
  }, [result, useExample]);

  const activeQuestionId =
    selectedQuestionId && questions.some((q) => q.id === selectedQuestionId)
      ? selectedQuestionId
      : (questions[0]?.id ?? null);

  const selectedQuestion =
    questions.find((q) => q.id === activeQuestionId) ?? null;

  const pageRegions = useMemo(() => {
    const pageNumber = pages[pageIndex]?.pageNumber ?? 1;
    if (result?.regions?.length) {
      return result.regions.filter((r) => r.pageNumber === pageNumber);
    }
    if (useExample && selectedQuestion) {
      return [
        {
          id: "region_page6_stem",
          pageNumber: 1,
          type: "question_stem" as const,
          text: selectedQuestion.versions.source.stem,
          boundingBox: { x: 6, y: 8, width: 88, height: 18 },
          confidence: 0.92,
          associatedQuestionId: selectedQuestion.id,
        },
        {
          id: "region_page6_choices",
          pageNumber: 1,
          type: "answer_choices" as const,
          text: selectedQuestion.versions.source.choices
            .map((c) => `${c.label}. ${c.text}`)
            .join("\n"),
          boundingBox: { x: 8, y: 28, width: 70, height: 22 },
          confidence: 0.9,
          associatedQuestionId: selectedQuestion.id,
        },
        {
          id: "region_page6_reference",
          pageNumber: 1,
          type: "reference_image" as const,
          text: null,
          boundingBox: { x: 8, y: 55, width: 84, height: 38 },
          confidence: 0.8,
          associatedQuestionId: selectedQuestion.id,
        },
      ];
    }
    return [];
  }, [result, pages, pageIndex, useExample, selectedQuestion]);

  const refreshHealth = useCallback(async () => {
    if (!signedIn) return;
    try {
      const token = await getClerkToken();
      setHealth(await fetchRagHealth(token));
    } catch {
      setHealth(null);
    }
  }, [signedIn]);

  useEffect(() => {
    if (!runId || !signedIn) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const token = await getClerkToken();
        const { run } = await fetchRagRun(token, runId);
        if (cancelled) return;
        setRunStatus(run.status);
        if (run.status === "COMPLETED" && run.output) {
          setResult(run.output as DocumentExtractionResult);
          setUseExample(false);
          setBusy(false);
          return;
        }
        if (
          run.status === "FAILED" ||
          run.status === "CRASHED" ||
          run.status === "CANCELED" ||
          run.status === "SYSTEM_FAILURE"
        ) {
          const message =
            typeof run.error === "string"
              ? run.error
              : run.error?.message ?? `Run ${run.status}`;
          setError(message);
          setBusy(false);
          return;
        }
        window.setTimeout(() => {
          void poll();
        }, 2000);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to poll run");
          setBusy(false);
        }
      }
    };

    void poll();
    return () => {
      cancelled = true;
    };
  }, [runId, signedIn]);

  const pickFile = (picked: File | null) => {
    if (!picked) return;
    if (
      picked.type !== "application/pdf" &&
      !picked.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please choose a PDF file.");
      return;
    }
    setFile(picked);
    setError(null);
    setResult(null);
    setRunId(null);
    setRunStatus(null);
    setUseExample(false);
  };

  const handleRender = async () => {
    if (!file) return;
    setRendering(true);
    setError(null);
    setRenderProgress("Reading PDF…");
    try {
      const rendered = await renderPdfPages(file, {
        maxPages,
        scale: 1.5,
        onProgress: (done, total) =>
          setRenderProgress(`Rendering page ${done}/${total}…`),
      });
      setPages(rendered);
      setPageIndex(0);
      setRenderProgress(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to render PDF");
    } finally {
      setRendering(false);
    }
  };

  const handleExtract = async () => {
    if (!signedIn || pages.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    setRunStatus("QUEUED");
    try {
      const token = await getClerkToken();
      void refreshHealth();
      const handle = await triggerRagTask(token, "process-document", {
        documentId,
        pages: pages.map((p) => ({
          pageNumber: p.pageNumber,
          pageText: p.pageText,
          pageImageUrl: p.pageImageUrl,
        })),
      });
      setRunId(handle.runId);
      setRunStatus("QUEUED");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start extraction");
      setBusy(false);
    }
  };

  const handleHello = async () => {
    if (!signedIn || busy) return;
    setBusy(true);
    setError(null);
    try {
      const token = await getClerkToken();
      const handle = await triggerRagTask(token, "hello-world", {
        name: "RAG lab",
      });
      setRunId(handle.runId);
      setRunStatus("QUEUED");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger hello-world");
      setBusy(false);
    }
  };

  const version = selectedQuestion?.versions[versionTab];
  const currentPage = pages[pageIndex] ?? null;

  return (
    <div
      className="min-h-[100dvh]"
      style={{ background: C.bg, color: C.ink, fontFamily: "var(--font-nunito), sans-serif" }}
    >
      <header
        className="sticky top-0 z-20 border-b backdrop-blur-sm"
        style={{ borderColor: C.line, background: "rgba(243,245,244,0.92)" }}
      >
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] uppercase" style={{ color: C.sub }}>
              DrNote · RAG lab
            </p>
            <h1 className="text-xl font-extrabold tracking-tight" style={{ color: C.ink }}>
              Exam-recall extraction
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span
              className="rounded-md px-2.5 py-1 font-semibold"
              style={{
                background: health?.triggerConfigured ? C.accentSoft : C.warnSoft,
                color: health?.triggerConfigured ? C.accent : C.warn,
              }}
            >
              Trigger {health?.triggerConfigured ? "ready" : "not configured"}
            </span>
            <button
              type="button"
              onClick={() => void refreshHealth()}
              className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 font-semibold"
              style={{ borderColor: C.line, color: C.sub }}
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-4 px-4 py-4 lg:grid-cols-[280px_1fr]">
        <aside
          className="h-fit rounded-xl border p-4"
          style={{ background: C.panel, borderColor: C.line }}
        >
          <p className="text-sm font-bold">1. Load PDF</p>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: C.sub }}>
            Pages may contain zero, one, or many questions. Extraction segments
            semantic regions — not page = question.
          </p>

          {!signedIn ? (
            <div className="mt-4 rounded-lg p-3 text-sm" style={{ background: C.warnSoft, color: C.warn }}>
              <p className="font-semibold">Sign in to trigger Trigger.dev tasks</p>
              <div className="mt-2">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="rounded-md px-3 py-1.5 text-sm font-bold text-white"
                    style={{ background: C.accent }}
                  >
                    Sign in
                  </button>
                </SignInButton>
              </div>
            </div>
          ) : null}

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-6 text-sm font-semibold"
            style={{ borderColor: C.line, color: C.ink, background: C.bg }}
          >
            <Upload className="size-4" />
            {file ? file.name : "Choose PDF"}
          </button>

          <label className="mt-3 block text-xs font-semibold" style={{ color: C.sub }}>
            Max pages (incremental)
            <input
              type="number"
              min={1}
              max={50}
              value={maxPages}
              onChange={(e) => setMaxPages(Number(e.target.value) || 1)}
              className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
              style={{ borderColor: C.line }}
            />
          </label>

          <button
            type="button"
            disabled={!file || rendering}
            onClick={() => void handleRender()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
            style={{ background: C.accent }}
          >
            {rendering ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
            Render pages
          </button>

          <button
            type="button"
            disabled={!signedIn || pages.length === 0 || busy}
            onClick={() => void handleExtract()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
            style={{ background: C.ink }}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            Run process-document
          </button>

          <button
            type="button"
            disabled={!signedIn || busy}
            onClick={() => void handleHello()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50"
            style={{ borderColor: C.line }}
          >
            <Wand2 className="size-4" />
            Ping hello-world
          </button>

          <button
            type="button"
            onClick={() => {
              setUseExample(true);
              setResult(null);
              setSelectedQuestionId(EXAMPLE_EXTRACTED_QUESTION.id);
            }}
            className="mt-2 w-full rounded-lg px-3 py-2 text-sm font-semibold"
            style={{ background: C.accentSoft, color: C.accent }}
          >
            Load example question JSON
          </button>

          {renderProgress ? (
            <p className="mt-3 text-xs" style={{ color: C.sub }}>
              {renderProgress}
            </p>
          ) : null}
          {runId ? (
            <p className="mt-3 text-xs leading-relaxed" style={{ color: C.sub }}>
              Run <span className="font-mono">{runId}</span>
              <br />
              Status: <strong>{runStatus ?? "…"}</strong>
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 text-xs font-semibold" style={{ color: C.danger }}>
              {error}
            </p>
          ) : null}

          <div className="mt-5 border-t pt-4" style={{ borderColor: C.line }}>
            <p className="text-xs font-bold tracking-wide uppercase" style={{ color: C.sub }}>
              Questions
            </p>
            <ul className="mt-2 space-y-1.5">
              {questions.map((q) => {
                const label = originLabel(q.origin);
                const active = q.id === activeQuestionId;
                return (
                  <li key={q.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedQuestionId(q.id)}
                      className="w-full rounded-md px-2 py-2 text-left text-xs"
                      style={{
                        background: active ? C.accentSoft : "transparent",
                        color: C.ink,
                      }}
                    >
                      <span
                        className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                        style={{ background: `${label.color}22`, color: label.color }}
                      >
                        {label.text}
                      </span>
                      <span className="mt-1 block line-clamp-2 font-semibold">
                        {q.versions.source.stem || q.versions.normalized.stem}
                      </span>
                      <span style={{ color: C.sub }}>{q.usabilityStatus}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        <section className="grid min-h-[70vh] gap-3 xl:grid-cols-3">
          {/* Left: original page */}
          <div
            className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border"
            style={{ background: C.panel, borderColor: C.line }}
          >
            <div
              className="flex items-center justify-between border-b px-3 py-2 text-xs font-bold"
              style={{ borderColor: C.line, color: C.sub }}
            >
              <span>Original page</span>
              {pages.length > 0 ? (
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pageIndex <= 0}
                    onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                    className="disabled:opacity-40"
                  >
                    ←
                  </button>
                  {pageIndex + 1}/{pages.length}
                  <button
                    type="button"
                    disabled={pageIndex >= pages.length - 1}
                    onClick={() =>
                      setPageIndex((i) => Math.min(pages.length - 1, i + 1))
                    }
                    className="disabled:opacity-40"
                  >
                    →
                  </button>
                </span>
              ) : null}
            </div>
            <div className="relative flex-1 overflow-auto bg-[#E8ECEA] p-3">
              {currentPage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentPage.pageImageUrl}
                  alt={`Page ${currentPage.pageNumber}`}
                  className="mx-auto max-w-full shadow-sm"
                />
              ) : (
                <div
                  className="flex h-full min-h-[320px] items-center justify-center text-sm"
                  style={{ color: C.sub }}
                >
                  Render a PDF or load the example to inspect the review panels.
                </div>
              )}
            </div>
          </div>

          {/* Center: boundaries */}
          <div
            className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border"
            style={{ background: C.panel, borderColor: C.line }}
          >
            <div
              className="border-b px-3 py-2 text-xs font-bold"
              style={{ borderColor: C.line, color: C.sub }}
            >
              Detected regions
            </div>
            <div className="relative flex-1 overflow-auto bg-[#E8ECEA] p-3">
              <div className="relative mx-auto max-w-full">
                {currentPage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentPage.pageImageUrl}
                    alt=""
                    className="block w-full opacity-90"
                  />
                ) : (
                  <div
                    className="min-h-[320px] rounded-md border border-dashed"
                    style={{ borderColor: C.line, background: "#F8FAF9" }}
                  />
                )}
                <RegionOverlay
                  regions={pageRegions}
                  selectedId={selectedRegionId}
                  onSelect={setSelectedRegionId}
                />
              </div>
              <ul className="mt-3 space-y-1 text-xs">
                {pageRegions.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedRegionId(r.id)}
                      className="w-full rounded px-2 py-1 text-left font-semibold"
                      style={{
                        background:
                          selectedRegionId === r.id ? C.accentSoft : "transparent",
                        color: C.ink,
                      }}
                    >
                      {r.type}
                      <span className="ml-2 font-normal" style={{ color: C.sub }}>
                        {Math.round(r.confidence * 100)}%
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: JSON versions */}
          <div
            className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border"
            style={{ background: C.panel, borderColor: C.line }}
          >
            <div
              className="flex flex-wrap items-center gap-1 border-b px-2 py-2"
              style={{ borderColor: C.line }}
            >
              {(
                [
                  ["source", "Source"],
                  ["normalized", "Normalized"],
                  ["quizReady", "Quiz-ready"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setVersionTab(key)}
                  className="rounded-md px-2.5 py-1 text-xs font-bold"
                  style={{
                    background: versionTab === key ? C.ink : "transparent",
                    color: versionTab === key ? "#fff" : C.sub,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-auto p-3 text-xs">
              {selectedQuestion ? (
                <>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {(() => {
                      const label = originLabel(selectedQuestion.origin);
                      return (
                        <span
                          className="rounded px-2 py-0.5 text-[10px] font-bold uppercase"
                          style={{
                            background: `${label.color}22`,
                            color: label.color,
                          }}
                        >
                          {label.text}
                        </span>
                      );
                    })()}
                    <span
                      className="rounded px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{ background: C.warnSoft, color: C.warn }}
                    >
                      {selectedQuestion.answer.status}
                    </span>
                    <span
                      className="rounded px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{ background: C.accentSoft, color: C.accent }}
                    >
                      {selectedQuestion.usabilityStatus}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold tracking-wide uppercase" style={{ color: C.sub }}>
                    Stem ({versionTab})
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-relaxed">
                    {version?.stem || "(null)"}
                  </p>
                  <p
                    className="mt-4 text-[11px] font-bold tracking-wide uppercase"
                    style={{ color: C.sub }}
                  >
                    Choices
                  </p>
                  <ul className="mt-1 space-y-1">
                    {(version?.choices ?? []).map((choice) => {
                      const correct =
                        choice.id === selectedQuestion.answer.correctChoiceId;
                      return (
                        <li
                          key={choice.id}
                          className="rounded-md px-2 py-1.5"
                          style={{
                            background: correct ? C.accentSoft : C.bg,
                            color: C.ink,
                          }}
                        >
                          <strong>{choice.label ?? "?"}</strong>. {choice.text}
                        </li>
                      );
                    })}
                  </ul>
                  {selectedQuestion.warnings.length > 0 ? (
                    <>
                      <p
                        className="mt-4 text-[11px] font-bold tracking-wide uppercase"
                        style={{ color: C.warn }}
                      >
                        Warnings
                      </p>
                      <ul className="mt-1 list-disc space-y-1 pl-4" style={{ color: C.warn }}>
                        {selectedQuestion.warnings.map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  <details className="mt-4">
                    <summary className="cursor-pointer font-bold" style={{ color: C.sub }}>
                      Full JSON
                    </summary>
                    <pre
                      className="mt-2 overflow-auto rounded-md p-2 text-[10px] leading-relaxed"
                      style={{ background: C.bg }}
                    >
                      {JSON.stringify(selectedQuestion, null, 2)}
                    </pre>
                  </details>
                </>
              ) : (
                <p style={{ color: C.sub }}>No question selected.</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
