"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getWikiLinkPreview, type WikiLinkPreview } from "@/lib/pages";

const SHOW_DELAY_MS = 200;
const HIDE_DELAY_MS = 160;
const CARD_WIDTH = 340;
const GAP = 8;

type PreviewState = {
  preview: WikiLinkPreview;
  top: number;
  left: number;
  placement: "below" | "above";
};

function computePosition(rect: DOMRect): Pick<PreviewState, "top" | "left" | "placement"> {
  const spaceBelow = window.innerHeight - rect.bottom;
  const placement: "below" | "above" = spaceBelow < 220 && rect.top > 240 ? "above" : "below";
  const left = Math.min(
    Math.max(GAP, rect.left),
    window.innerWidth - CARD_WIDTH - GAP
  );
  const top = placement === "below" ? rect.bottom + GAP : rect.top - GAP;
  return { top, left, placement };
}

/**
 * Notion-style "peek" card shown when hovering an internal wiki link in the
 * article reader. Read-only preview of the target page (title, subject,
 * snippet, meta) with an "Open" affordance. Purely additive — it never
 * intercepts the link's own behavior.
 */
export function WikiLinkHoverPreview({
  containerSelector = ".simple-editor-scroll",
}: {
  containerSelector?: string;
}) {
  const [state, setState] = useState<PreviewState | null>(null);
  const showTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  const activeLink = useRef<HTMLElement | null>(null);

  const clearTimers = useCallback(() => {
    if (showTimer.current !== null) window.clearTimeout(showTimer.current);
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    showTimer.current = null;
    hideTimer.current = null;
  }, []);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      activeLink.current = null;
      setState(null);
    }, HIDE_DELAY_MS);
  }, []);

  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const handleOver = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest<HTMLElement>(
        "a.wiki-link[data-page-id], .auto-glossary[data-page-id]"
      );
      if (!link || link === activeLink.current) return;

      const pageId = link.getAttribute("data-page-id");
      if (!pageId) return;
      const preview = getWikiLinkPreview(pageId);
      if (!preview) return;

      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
      if (showTimer.current !== null) window.clearTimeout(showTimer.current);
      activeLink.current = link;
      showTimer.current = window.setTimeout(() => {
        const rect = link.getBoundingClientRect();
        setState({ preview, ...computePosition(rect) });
      }, SHOW_DELAY_MS);
    };

    const handleOut = (event: Event) => {
      const related = (event as MouseEvent).relatedTarget as HTMLElement | null;
      if (
        related?.closest?.(
          "a.wiki-link[data-page-id], .auto-glossary[data-page-id]"
        ) === activeLink.current
      ) {
        return;
      }
      if (related?.closest?.(".wiki-link-preview")) return;
      if (showTimer.current !== null) {
        window.clearTimeout(showTimer.current);
        showTimer.current = null;
      }
      scheduleHide();
    };

    container.addEventListener("mouseover", handleOver);
    container.addEventListener("mouseout", handleOut);
    return () => {
      container.removeEventListener("mouseover", handleOver);
      container.removeEventListener("mouseout", handleOut);
      clearTimers();
    };
  }, [containerSelector, clearTimers, scheduleHide]);

  useEffect(() => clearTimers, [clearTimers]);

  if (!state || typeof document === "undefined") return null;

  const { preview, top, left, placement } = state;

  return createPortal(
    <a
      className="wiki-link-preview"
      href={preview.href}
      style={{
        top: placement === "below" ? top : undefined,
        bottom:
          placement === "above" ? window.innerHeight - top : undefined,
        left,
        width: CARD_WIDTH,
      }}
      onMouseEnter={() => {
        if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
      }}
      onMouseLeave={scheduleHide}
    >
      {preview.subject ? (
        <span className="wiki-link-preview-subject">{preview.subject}</span>
      ) : null}
      <span className="wiki-link-preview-title">{preview.title}</span>
      {preview.snippet ? (
        <span className="wiki-link-preview-snippet">{preview.snippet}</span>
      ) : (
        <span className="wiki-link-preview-snippet is-muted">
          Open to read this topic.
        </span>
      )}
      <span className="wiki-link-preview-meta">
        {typeof preview.readMinutes === "number" ? (
          <span>{preview.readMinutes} min read</span>
        ) : null}
        {preview.updated ? <span>Updated {preview.updated}</span> : null}
        <span className="wiki-link-preview-open">Open →</span>
      </span>
    </a>,
    document.body
  );
}
