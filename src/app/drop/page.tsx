import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "fileDrop | DrNote",
  description: "Drop a PDF and extract questions, markdown, assets, quiz, and JSON.",
};

export default function DropPage() {
  return (
    <main className="h-[100dvh] w-full overflow-hidden bg-[#f7f6f2]">
      <iframe
        title="fileDrop"
        src="https://filedrop.mousab-r.workers.dev/?simple=1"
        className="h-full w-full border-0"
        allow="clipboard-read; clipboard-write"
      />
      <noscript>
        <a href="https://filedrop.mousab-r.workers.dev">Open fileDrop</a>
      </noscript>
    </main>
  );
}
