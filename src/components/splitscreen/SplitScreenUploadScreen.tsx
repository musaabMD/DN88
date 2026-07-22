"use client";

import { SignInButton } from "@clerk/clerk-react";
import { FileText, Loader2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { SS } from "@/components/splitscreen/splitscreen-theme";
import { useClerkEnabled, useClientMounted } from "@/hooks/useClerkEnabled";
import { CLERK_SIGN_IN_URL, CLERK_SIGN_UP_URL } from "@/lib/clerk";
import {
  fetchDocumentStatus,
  MedGeniusApiError,
  uploadDocument,
} from "@/lib/medgenius/api";
import { getClerkToken, isClerkSignedIn } from "@/lib/clerk-token";
import { sanitizeUserError } from "@/lib/medgenius/errors";

type SplitScreenUploadScreenProps = {
  examId: string;
  testMode?: boolean;
  onUploaded: (documentId: string) => void;
};

export function SplitScreenUploadScreen({
  examId,
  testMode,
  onUploaded,
}: SplitScreenUploadScreenProps) {
  const mounted = useClientMounted();
  const clerkEnabled = useClerkEnabled();
  const signedIn = mounted && clerkEnabled && isClerkSignedIn();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickFile = useCallback((picked: File | null) => {
    if (!picked) return;
    if (picked.type !== "application/pdf" && !picked.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      return;
    }
    setFile(picked);
    setError(null);
    if (!name.trim()) {
      setName(picked.name.replace(/\.pdf$/i, ""));
    }
  }, [name]);

  const pollUntilReady = useCallback(async (documentId: string, token: string | null) => {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const doc = await fetchDocumentStatus(token, documentId);
      if (doc.status === "completed" || doc.status === "failed") {
        return doc;
      }
      setStatusText(`Processing… ${doc.progress ?? 0}% (${doc.status})`);
      await new Promise((resolve) => window.setTimeout(resolve, 3000));
    }
    return fetchDocumentStatus(token, documentId);
  }, []);

  const handleUpload = async () => {
    if (!file || !name.trim() || uploading) return;
    if (!signedIn) return;

    setUploading(true);
    setError(null);
    setStatusText("Uploading PDF…");

    try {
      const token = await getClerkToken();
      const result = await uploadDocument(token, {
        file,
        name: name.trim(),
        examId,
      });

      if (result.duplicate) {
        onUploaded(result.documentId);
        return;
      }

      setStatusText("Parsing pages and extracting questions…");
      const doc = await pollUntilReady(result.documentId, token);

      if (doc.status === "failed") {
        throw new Error(doc.error ?? "Processing failed");
      }

      onUploaded(result.documentId);
    } catch (err) {
      const message =
        err instanceof MedGeniusApiError
          ? err.message
          : sanitizeUserError(err instanceof Error ? err.message : "Upload failed", "upload");
      setError(message);
      setStatusText(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="flex h-[100dvh] flex-col items-center justify-center px-4 py-8"
      style={{ background: SS.pageBg, color: SS.ink }}
    >
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <p
            className="text-[10px] font-extrabold uppercase tracking-[0.18em]"
            style={{ color: SS.faint }}
          >
            Split screen test
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Upload a PDF to start</h1>
          <p className="mt-2 text-sm font-semibold" style={{ color: SS.sub }}>
            Page-by-page parse, image extraction, and MCQ generation run automatically.
          </p>
          {testMode ? (
            <p
              className="mt-3 inline-block rounded-full px-3 py-1 text-xs font-extrabold"
              style={{ background: SS.greenWash, color: SS.greenDark }}
            >
              Test mode — no credit charges or plan limits
            </p>
          ) : null}
        </div>

        {!signedIn ? (
          <div
            className="rounded-2xl border bg-white p-8 text-center shadow-sm"
            style={{ borderColor: SS.panelBorder }}
          >
            <p className="text-sm font-semibold" style={{ color: SS.sub }}>
              Sign in to upload and test the extraction pipeline.
            </p>
            {clerkEnabled ? (
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="mt-4 rounded-xl px-5 py-3 text-sm font-extrabold text-white"
                  style={{ background: SS.blue }}
                >
                  Sign in
                </button>
              </SignInButton>
            ) : (
              <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                <a
                  href={CLERK_SIGN_IN_URL}
                  className="rounded-xl px-5 py-3 text-sm font-extrabold text-white"
                  style={{ background: SS.blue }}
                >
                  Sign in
                </a>
                <a
                  href={CLERK_SIGN_UP_URL}
                  className="rounded-xl border px-5 py-3 text-sm font-extrabold"
                  style={{ borderColor: SS.panelBorder, color: SS.ink }}
                >
                  Create account
                </a>
              </div>
            )}
          </div>
        ) : (
          <div
            className="rounded-2xl border bg-white p-5 shadow-sm"
            style={{ borderColor: SS.panelBorder }}
          >
            <input
              className="mb-3 w-full rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2"
              style={{ borderColor: SS.panelBorder }}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Document name"
              aria-label="Document name"
            />

            <button
              type="button"
              className={`mb-3 flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 transition ${
                dragging ? "border-[#1CB0F6] bg-[#EAF6FF]" : ""
              }`}
              style={{ borderColor: dragging ? SS.blue : SS.panelBorder }}
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                pickFile(event.dataTransfer.files?.[0] ?? null);
              }}
            >
              {file ? (
                <>
                  <FileText size={32} strokeWidth={2.2} style={{ color: SS.blue }} />
                  <span className="text-sm font-extrabold">{file.name}</span>
                  <span className="text-xs font-semibold" style={{ color: SS.sub }}>
                    Tap to replace
                  </span>
                </>
              ) : (
                <>
                  <Upload size={32} strokeWidth={2.2} style={{ color: SS.faint }} />
                  <span className="text-sm font-extrabold">Drop PDF here or tap to browse</span>
                </>
              )}
            </button>

            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
            />

            {error ? (
              <p className="mb-3 text-sm font-semibold text-red-600">{error}</p>
            ) : null}
            {statusText ? (
              <p
                className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold"
                style={{ color: SS.sub }}
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : null}
                {statusText}
              </p>
            ) : null}

            <button
              type="button"
              disabled={!file || !name.trim() || uploading}
              onClick={() => void handleUpload()}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold text-white transition disabled:opacity-50"
              style={{ background: SS.green }}
            >
              <Upload size={16} strokeWidth={2.6} />
              {uploading ? "Working…" : "Upload & process"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
