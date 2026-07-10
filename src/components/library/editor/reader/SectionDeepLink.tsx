"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Link2 } from "lucide-react";

type Anchor = { id: string; top: number; left: number } | null;

function scrollToId(id: string, container: HTMLElement) {
  const target = document.getElementById(id);
  if (!target) return;
  const offset =
    target.getBoundingClientRect().top -
    container.getBoundingClientRect().top +
    container.scrollTop -
    72;
  container.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
}

/**
 * Shareable section anchors: scrolls to `#hash` on load and shows a small
 * "copy link" affordance when hovering a heading. Non-invasive — it never
 * mutates the editor DOM.
 */
export function SectionDeepLink({
  containerSelector = ".simple-editor-scroll",
}: {
  containerSelector?: string;
}) {
  const [anchor, setAnchor] = useState<Anchor>(null);
  const [copied, setCopied] = useState(false);
  const hideTimer = useRef<number | null>(null);
  const activeHeading = useRef<HTMLElement | null>(null);

  // Jump to a section when the page loads with a hash.
  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!(container instanceof HTMLElement)) return;
    const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (!hash) return;
    const timer = window.setTimeout(() => scrollToId(hash, container), 120);
    return () => window.clearTimeout(timer);
  }, [containerSelector]);

  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!(container instanceof HTMLElement)) return;

    const place = (heading: HTMLElement) => {
      const rect = heading.getBoundingClientRect();
      setAnchor({
        id: heading.id,
        top: rect.top + rect.height / 2,
        left: rect.left,
      });
    };

    const onOver = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const heading = target?.closest<HTMLElement>(
        ".tiptap h1[id], .tiptap h2[id], .tiptap h3[id]"
      );
      if (!heading || !heading.id) return;
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
      activeHeading.current = heading;
      setCopied(false);
      place(heading);
    };

    const onOut = (event: Event) => {
      const related = (event as MouseEvent).relatedTarget as HTMLElement | null;
      if (related?.closest?.(".reader-anchor-btn")) return;
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setAnchor(null), 160);
    };

    container.addEventListener("mouseover", onOver);
    container.addEventListener("mouseout", onOut);
    return () => {
      container.removeEventListener("mouseover", onOver);
      container.removeEventListener("mouseout", onOut);
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    };
  }, [containerSelector]);

  const copyLink = async () => {
    if (!anchor) return;
    const url = `${window.location.origin}${window.location.pathname}#${anchor.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (!anchor || typeof document === "undefined") return null;

  return createPortal(
    <button
      type="button"
      className="reader-anchor-btn"
      title="Copy link to this section"
      aria-label="Copy link to this section"
      style={{ top: anchor.top, left: anchor.left - 30 }}
      onMouseEnter={() => {
        if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
      }}
      onMouseLeave={() => setAnchor(null)}
      onClick={copyLink}
    >
      {copied ? <Check size={14} /> : <Link2 size={14} />}
    </button>,
    document.body
  );
}
