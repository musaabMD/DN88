"use client";

import { SignInButton } from "@clerk/clerk-react";
import { Loader2, Upload } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  extractDocument,
  fetchRagHealth,
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
  const processingRef = useRef(false);

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<RenderedPdfPage[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentExtractionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [versionTab, setVersionTab] = useState<VersionTab>("source");

  const questions = result?.questions ?? [];

  const activeQuestionId =
    selectedQuestionId && questions.some((q) => q.id === selectedQuestionId)
      ? selectedQuestionId
      : (questions[0]?.id ?? null);

  const selectedQuestion =
    questions.find((q) => q.id === activeQuestionId) ?? null;

  const pageRegions = useMemo(() => {
    const pageNumber = pages[pageIndex]?.pageNumber ?? 1;
    if (!result?.regions?.length) return [];
    return result.regions.filter((r) => r.pageNumber === pageNumber);
  }, [result, pages, pageIndex]);

  const processPdf = useCallback(
    async (picked: File) => {
      if (processingRef.current) return;
      if (!signedIn) return;

      processingRef.current = true;
      setBusy(true);
      setError(null);
      setResult(null);
      setPages([]);
      setPageIndex(0);
      setSelectedQuestionId(null);
      setFile(picked);
      setStatus("Reading PDF…");

      const documentId = `doc_${picked.name.replace(/\W+/g, "_").slice(0, 40)}`;

      try {
        const token = await getClerkToken();
        const health = await fetchRagHealth(token);

        if (!health.triggerConfigured && !health.openRouterConfigured) {
          throw new Error("Extraction is not configured on the server.");
        }

        const rendered = await renderPdfPages(picked, {
          scale: 1.5,
          onProgress: (done, total) =>
            setStatus(`Rendering page ${done}/${total}…`),
        });

        setPages(rendered);
        setStatus(`Extracting ${rendered.length} page(s)…`);

        const merged = await extractDocument(
          token,
          documentId,
          rendered.map((p) => ({
            pageNumber: p.pageNumber,
            pageText: p.pageText,
            pageImageUrl: p.pageImageUrl,
          })),
          {
            preferTrigger: Boolean(health.triggerConfigured),
            onProgress: (done, total, batchStatus) => {
              setStatus(batchStatus ?? `Extracting page ${done}/${total}…`);
            },
          },
        );

        setResult(merged);
        setStatus(
          merged.questions.length > 0
            ? `Done — ${merged.questions.length} question(s) found.`
            : `Done — no questions detected.`,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Processing failed");
        setStatus(null);
      } finally {
        setBusy(false);
        processingRef.current = false;
      }
    },
    [signedIn],
  );

  const onPickFile = useCallback(
    (picked: File | null) => {
      if (!picked) return;
      if (
        picked.type !== "application/pdf" &&
        !picked.name.toLowerCase().endsWith(".pdf")
      ) {
        setError("Please upload a PDF file.");
        return;
      }
      if (!signedIn) {
        setError("Sign in to process your PDF.");
        return;
      }
      void processPdf(picked);
    },
    [processPdf, signedIn],
  );

  const version = selectedQuestion?.versions[versionTab];
  const currentPage = pages[pageIndex] ?? null;
  const showUpload = !busy && !result;

  const uploadZone = (
    <div
      className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-16 text-center transition-colors"
      style={{
        borderColor: dragging ? C.accent : C.line,
        background: dragging ? C.accentSoft : C.panel,
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        onPickFile(e.dataTransfer.files[0] ?? null);
      }}
    >
      {busy ? (
        <>
          <Loader2
            className="size-10 animate-spin"
            style={{ color: C.accent }}
          />
          <p className="mt-4 text-lg font-bold">{status ?? "Working…"}</p>
          {file ? (
            <p className="mt-1 text-sm" style={{ color: C.sub }}>
              {file.name}
            </p>
          ) : null}
        </>
      ) : (
        <>
          <Upload className="size-10" style={{ color: C.accent }} />
          <p className="mt-4 text-lg font-bold">Drop your PDF here</p>
          <p className="mt-1 text-sm" style={{ color: C.sub }}>
            Or click to upload — we render and extract automatically.
          </p>
          {!signedIn && mounted && clerkEnabled ? (
            <div className="mt-5">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="rounded-lg px-4 py-2 text-sm font-bold text-white"
                  style={{ background: C.accent }}
                >
                  Sign in to upload
                </button>
              </SignInButton>
            </div>
          ) : (
            <button
              type="button"
              disabled={!signedIn}
              onClick={() => inputRef.current?.click()}
              className="mt-5 rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              style={{ background: C.accent }}
            >
              Choose PDF
            </button>
          )}
        </>
      )}
    </div>
  );

  return (
    <div
      className="min-h-[100dvh]"
      style={{
        background: C.bg,
        color: C.ink,
        fontFamily: "var(--font-nunito), sans-serif",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
      />

      <header
        className="border-b px-4 py-3"
        style={{ borderColor: C.line, background: C.panel }}
      >
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
          <div>
            <p
              className="text-xs font-semibold tracking-[0.18em] uppercase"
              style={{ color: C.sub }}
            >
              DrNote · RAG
            </p>
            <h1 className="text-lg font-extrabold">Upload PDF → extract questions</h1>
          </div>
          {status && !showUpload ? (
            <p className="text-sm font-semibold" style={{ color: C.accent }}>
              {status}
            </p>
          ) : null}
          {result ? (
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setPages([]);
                setFile(null);
                setStatus(null);
                setError(null);
                inputRef.current?.click();
              }}
              className="rounded-lg border px-3 py-1.5 text-sm font-semibold"
              style={{ borderColor: C.line }}
            >
              Upload another
            </button>
          ) : null}
        </div>
      </header>

      {error ? (
        <p
          className="mx-auto max-w-[1600px] px-4 py-2 text-sm font-semibold"
          style={{ color: C.danger }}
        >
          {error}
        </p>
      ) : null}

      {showUpload ? (
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
          {uploadZone}
        </div>
      ) : null}

      {busy && !showUpload && !result ? (
        <div className="flex min-h-[40vh] items-center justify-center px-4 py-8">
          {uploadZone}
        </div>
      ) : null}

      {result ? (
        <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-4">
          {questions.length > 0 ? (
            <div
              className="flex gap-2 overflow-x-auto rounded-xl border p-2"
              style={{ background: C.panel, borderColor: C.line }}
            >
              {questions.map((q) => {
                const label = originLabel(q.origin);
                const active = q.id === activeQuestionId;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setSelectedQuestionId(q.id)}
                    className="min-w-[200px] shrink-0 rounded-lg px-3 py-2 text-left text-xs"
                    style={{
                      background: active ? C.accentSoft : C.bg,
                      color: C.ink,
                    }}
                  >
                    <span
                      className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                      style={{
                        background: `${label.color}22`,
                        color: label.color,
                      }}
                    >
                      {label.text}
                    </span>
                    <span className="mt-1 block line-clamp-2 font-semibold">
                      {q.versions.source.stem || q.versions.normalized.stem}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <section className="grid min-h-[60vh] gap-3 xl:grid-cols-3">
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
                ) : null}
              </div>
            </div>

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
                  ) : null}
                  <RegionOverlay
                    regions={pageRegions}
                    selectedId={selectedRegionId}
                    onSelect={setSelectedRegionId}
                  />
                </div>
              </div>
            </div>

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
                    <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed">
                      {version?.stem || "(null)"}
                    </p>
                    <ul className="mt-3 space-y-1">
                      {(version?.choices ?? []).map((choice) => (
                        <li
                          key={choice.id}
                          className="rounded-md px-2 py-1.5"
                          style={{ background: C.bg }}
                        >
                          <strong>{choice.label ?? "?"}</strong>. {choice.text}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p style={{ color: C.sub }}>No questions extracted.</p>
                )}
              </div>
            </div>
          </section>
        </main>
      ) : null}
    </div>
  );
}
