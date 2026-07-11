"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Copy, GripVertical } from "lucide-react";
import { CitationList } from "@/components/tool-ui/citation";
import type { LibraryArticle } from "@/lib/set-content";
import { cn } from "@/lib/utils";

const BLOCK_SELECTOR =
  ".tiptap p, .tiptap .article-callout, .tiptap li, .tiptap blockquote, .tiptap pre";

type BlockHandleState = {
  block: HTMLElement;
  top: number;
  left: number;
};

function getSectionCitations(
  article: LibraryArticle,
  sectionId: string | null | undefined
) {
  if (!sectionId) return [];
  const section = article.sections.find((entry) => entry.id === sectionId);
  return section?.citations ?? [];
}

function enhanceCollapsibleSections(container: HTMLElement): () => void {
  const headings = container.querySelectorAll<HTMLElement>(
    "h2.article-section-heading"
  );
  const cleanups: Array<() => void> = [];

  headings.forEach((heading) => {
    if (heading.dataset.collapseEnhanced === "true") return;

    const toMove: Element[] = [];
    let sibling = heading.nextElementSibling;
    while (sibling && !sibling.matches("h2.article-section-heading")) {
      toMove.push(sibling);
      sibling = sibling.nextElementSibling;
    }
    if (toMove.length === 0) return;

    heading.dataset.collapseEnhanced = "true";
    heading.classList.add("is-collapsible");
    heading.setAttribute("role", "button");
    heading.setAttribute("tabindex", "0");
    heading.setAttribute("aria-expanded", "true");

    const panel = document.createElement("div");
    panel.className = "article-section-panel";
    panel.dataset.sectionId = heading.dataset.sectionId ?? "";

    for (const node of toMove) {
      panel.appendChild(node);
    }
    heading.after(panel);

    const toggle = () => {
      const collapsed = panel.classList.toggle("is-collapsed");
      heading.classList.toggle("is-collapsed", collapsed);
      heading.setAttribute("aria-expanded", String(!collapsed));
    };

    const onHeadingClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("a, button, .reader-section-link")) return;
      toggle();
    };

    const onHeadingKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    };

    heading.addEventListener("click", onHeadingClick);
    heading.addEventListener("keydown", onHeadingKeyDown);

    cleanups.push(() => {
      heading.removeEventListener("click", onHeadingClick);
      heading.removeEventListener("keydown", onHeadingKeyDown);
      while (panel.firstChild) {
        heading.after(panel.firstChild);
      }
      panel.remove();
      heading.classList.remove("is-collapsible", "is-collapsed");
      heading.removeAttribute("role");
      heading.removeAttribute("tabindex");
      heading.removeAttribute("aria-expanded");
      delete heading.dataset.collapseEnhanced;
    });
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}

function markContentBlocks(container: HTMLElement): () => void {
  const blocks = container.querySelectorAll<HTMLElement>(BLOCK_SELECTOR);
  blocks.forEach((block) => block.classList.add("article-content-block"));
  return () => {
    blocks.forEach((block) => block.classList.remove("article-content-block"));
  };
}

function mountSectionCitations(
  container: HTMLElement,
  article: LibraryArticle
): () => void {
  const roots: Root[] = [];
  const panels = container.querySelectorAll<HTMLElement>(".article-section-panel");

  panels.forEach((panel) => {
    const sectionId = panel.dataset.sectionId;
    const citations = getSectionCitations(article, sectionId);
    if (citations.length === 0) return;
    if (panel.querySelector(".article-section-citations")) return;

    const host = document.createElement("div");
    host.className = "article-section-citations";
    panel.appendChild(host);

    const root = createRoot(host);
    root.render(
      <div className="article-section-citations-inner">
        <p className="article-section-citations-label">Sources</p>
        <CitationList
          id={`section-citations-${sectionId ?? "unknown"}`}
          citations={citations}
          variant="stacked"
          size="compact"
        />
      </div>
    );
    roots.push(root);
  });

  return () => {
    for (const root of roots) {
      root.unmount();
    }
    container
      .querySelectorAll(".article-section-citations")
      .forEach((node) => node.remove());
  };
}

function findBlockTarget(container: HTMLElement, target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return null;
  const block = target.closest<HTMLElement>(BLOCK_SELECTOR);
  if (!block || !container.contains(block)) return null;
  return block;
}

export function ArticleReaderEnhancements({
  article,
  containerSelector,
  enabled,
  contentEpoch = 0,
}: {
  article: LibraryArticle;
  containerSelector: string;
  enabled: boolean;
  contentEpoch?: number;
}) {
  const [handle, setHandle] = useState<BlockHandleState | null>(null);
  const [copied, setCopied] = useState(false);
  const selectedRef = useRef<HTMLElement | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  const updateHandlePosition = useCallback(
    (block: HTMLElement) => {
      const container = document.querySelector<HTMLElement>(containerSelector);
      if (!container) return;
      const blockRect = block.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setHandle({
        block,
        top: blockRect.top - containerRect.top + container.scrollTop + 4,
        left: Math.max(0, blockRect.left - containerRect.left - 28),
      });
    },
    [containerSelector]
  );

  useEffect(() => {
    if (!enabled) return;
    const container = document.querySelector<HTMLElement>(containerSelector);
    if (!container) return;

    const cleanupCollapse = enhanceCollapsibleSections(container);
    const cleanupBlocks = markContentBlocks(container);
    const cleanupCitations = mountSectionCitations(container, article);

    return () => {
      cleanupCollapse();
      cleanupBlocks();
      cleanupCitations();
      selectedRef.current?.classList.remove("is-block-selected");
      selectedRef.current = null;
      setHandle(null);
    };
  }, [article, containerSelector, contentEpoch, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const container = document.querySelector<HTMLElement>(containerSelector);
    if (!container) return;

    const onMouseOver = (event: MouseEvent) => {
      const block = findBlockTarget(container, event.target);
      if (!block) return;
      if (selectedRef.current === block) return;
      selectedRef.current?.classList.remove("is-block-selected");
      selectedRef.current = block;
      block.classList.add("is-block-selected");
      updateHandlePosition(block);
    };

    const onMouseLeave = (event: MouseEvent) => {
      const related = event.relatedTarget;
      if (
        related instanceof HTMLElement &&
        (related.closest(".article-block-handle") ||
          related.closest(BLOCK_SELECTOR))
      ) {
        return;
      }
      selectedRef.current?.classList.remove("is-block-selected");
      selectedRef.current = null;
      setHandle(null);
    };

    const onScroll = () => {
      if (selectedRef.current) {
        updateHandlePosition(selectedRef.current);
      }
    };

    container.addEventListener("mouseover", onMouseOver);
    container.addEventListener("mouseleave", onMouseLeave);
    container.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      container.removeEventListener("mouseover", onMouseOver);
      container.removeEventListener("mouseleave", onMouseLeave);
      container.removeEventListener("scroll", onScroll);
    };
  }, [containerSelector, enabled, updateHandlePosition]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const copyBlock = async () => {
    if (!handle?.block) return;
    const text = handle.block.innerText.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (!enabled || !handle) return null;

  return (
    <div
      className="article-block-handle"
      style={{ top: handle.top, left: handle.left }}
      onPointerDown={(event) => event.preventDefault()}
    >
      <span className="article-block-handle-grip" aria-hidden>
        <GripVertical size={14} strokeWidth={2} />
      </span>
      <button
        type="button"
        className={cn("article-block-handle-copy", copied && "is-copied")}
        aria-label={copied ? "Copied" : "Copy block"}
        title={copied ? "Copied!" : "Copy block"}
        onClick={() => void copyBlock()}
      >
        <Copy size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
