"use client";

import { useEffect, useRef, useState } from "react";
import {
  getArticleScroll,
  saveArticleScroll,
} from "@/lib/library-editor-preferences";

/**
 * Thin reading-progress bar pinned just under the header, plus resume of the
 * last scroll position per article. Additive — does not alter the header.
 */
export function ReaderProgress({
  articleId,
  containerSelector = ".simple-editor-scroll",
}: {
  articleId: string;
  containerSelector?: string;
}) {
  const [progress, setProgress] = useState(0);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    const root = document.querySelector(containerSelector);
    if (!(root instanceof HTMLElement)) return;

    const update = () => {
      const max = root.scrollHeight - root.clientHeight;
      setProgress(max > 0 ? Math.min(1, root.scrollTop / max) : 0);
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        saveArticleScroll(articleId, root.scrollTop);
      }, 400);
    };

    // Resume last position once the content has laid out.
    const resume = window.setTimeout(() => {
      const saved = getArticleScroll(articleId);
      if (saved > 0 && saved < root.scrollHeight) {
        root.scrollTop = saved;
      }
      update();
    }, 60);

    root.addEventListener("scroll", update, { passive: true });
    return () => {
      window.clearTimeout(resume);
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
      root.removeEventListener("scroll", update);
    };
  }, [articleId, containerSelector]);

  return (
    <div className="reader-progress" aria-hidden>
      <div
        className="reader-progress-fill"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
