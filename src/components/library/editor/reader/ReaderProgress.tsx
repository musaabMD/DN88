"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Thin reading-progress bar pinned just under the header.
 */
export function ReaderProgress({
  containerSelector = ".simple-editor-scroll",
}: {
  articleId?: string;
  containerSelector?: string;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const root = document.querySelector(containerSelector);
    if (!(root instanceof HTMLElement)) return;

    const update = () => {
      const max = root.scrollHeight - root.clientHeight;
      setProgress(max > 0 ? Math.min(1, root.scrollTop / max) : 0);
    };

    update();
    root.addEventListener("scroll", update, { passive: true });
    return () => root.removeEventListener("scroll", update);
  }, [containerSelector]);

  return (
    <div className="reader-progress" aria-hidden>
      <div
        className="reader-progress-fill"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
