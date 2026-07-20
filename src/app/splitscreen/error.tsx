"use client";

import Link from "next/link";

export default function SplitScreenError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[#F6F7F9] p-6 text-center">
      <h1 className="text-lg font-black text-[#3C3C3C]">Split screen failed to load</h1>
      <p className="max-w-sm text-sm font-semibold text-[#777]">
        Try reloading, or open{" "}
        <a href="https://drnote.co/splitscreen/" className="text-[#1899D6] underline">
          drnote.co/splitscreen
        </a>{" "}
        in a regular browser tab.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-[#3C3C3C] px-4 py-2 text-sm font-extrabold text-white"
        >
          Reload
        </button>
        <Link
          href="/qbank/smle/"
          className="rounded-lg border border-[#E5E5E5] bg-white px-4 py-2 text-sm font-extrabold text-[#777]"
        >
          Back to SMLE
        </Link>
      </div>
    </div>
  );
}
