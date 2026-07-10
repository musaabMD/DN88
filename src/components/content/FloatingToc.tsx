"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ListTree, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface FloatingTocProps {
  /** CSS selector for the container holding the headings. */
  containerSelector?: string;
  /** Which heading tags to include. */
  headingSelector?: string;
  /** Extra classes for the floating wrapper. */
  className?: string;
}

function collectHeadings(
  root: ParentNode,
  headingSelector: string
): TocItem[] {
  const headings = Array.from(
    root.querySelectorAll<HTMLHeadingElement>(headingSelector)
  );

  return headings.map((el, i) => {
    if (!el.id) {
      el.id =
        el.textContent
          ?.trim()
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-") || `section-${i}`;
    }
    return {
      id: el.id,
      text: el.textContent?.trim() ?? "",
      level: Number(el.tagName.charAt(1)),
    };
  });
}

export function FloatingToc({
  containerSelector,
  headingSelector = "h2, h3",
  className,
}: FloatingTocProps) {
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<TocItem[]>([]);
  const [activeId, setActiveId] = React.useState<string>("");
  const [pageTitle, setPageTitle] = React.useState<string>("");
  const [progress, setProgress] = React.useState(0);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const navRef = React.useRef<HTMLElement>(null);
  const activeItemRef = React.useRef<HTMLLIElement>(null);

  const getRoot = React.useCallback((): ParentNode => {
    if (containerSelector) {
      return document.querySelector(containerSelector) ?? document;
    }
    return document;
  }, [containerSelector]);

  const refreshItems = React.useCallback(() => {
    const root = getRoot();
    const h1 = root.querySelector("h1");
    setPageTitle(h1?.textContent?.trim() || document.title || "Contents");
    setItems(collectHeadings(root, headingSelector));
  }, [getRoot, headingSelector]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Initial scan + watch for late-rendered TipTap headings on mobile.
  React.useEffect(() => {
    refreshItems();

    const root = containerSelector
      ? document.querySelector(containerSelector)
      : null;

    if (!(root instanceof Element)) return;

    const observer = new MutationObserver(() => {
      refreshItems();
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [containerSelector, refreshItems]);

  // Re-scan when panel opens so mobile always has the full list.
  React.useEffect(() => {
    if (!open) return;
    refreshItems();
  }, [open, refreshItems]);

  // Keep active section visible inside the scrollable nav on mobile.
  React.useEffect(() => {
    if (!open || !activeItemRef.current || !navRef.current) return;
    activeItemRef.current.scrollIntoView({ block: "nearest" });
  }, [open, activeId, items.length]);

  React.useEffect(() => {
    if (items.length === 0) return;

    const scrollRoot = containerSelector
      ? document.querySelector(containerSelector)
      : null;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      {
        root: scrollRoot instanceof Element ? scrollRoot : null,
        rootMargin: "-80px 0px -55% 0px",
        threshold: [0, 0.1, 0.5, 1],
      }
    );

    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const onScroll = () => {
      if (scrollRoot instanceof Element) {
        const max = scrollRoot.scrollHeight - scrollRoot.clientHeight;
        setProgress(max > 0 ? Math.min(1, scrollRoot.scrollTop / max) : 0);
        return;
      }
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? Math.min(1, doc.scrollTop / max) : 0);
    };

    onScroll();
    const target = scrollRoot ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      target.removeEventListener("scroll", onScroll);
    };
  }, [items, containerSelector]);

  React.useEffect(() => {
    if (!open) return;

    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const scrollTo = (id: string) => {
    const scrollRoot = containerSelector
      ? document.querySelector(containerSelector)
      : null;
    const target = document.getElementById(id);

    if (target && scrollRoot instanceof Element) {
      const offset =
        target.getBoundingClientRect().top -
        scrollRoot.getBoundingClientRect().top +
        scrollRoot.scrollTop -
        72;
      scrollRoot.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
    } else {
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setActiveId(id);
    setOpen(false);
  };

  if (!mounted || items.length === 0) return null;

  const R = 22;
  const CIRC = 2 * Math.PI * R;

  let sectionNo = 0;
  const numbered = items.map((item) => {
    if (item.level === 2) sectionNo += 1;
    return { ...item, no: item.level === 2 ? sectionNo : null };
  });

  const ui = (
    <div
      ref={panelRef}
      className={cn(
        "fixed bottom-4 right-4 z-[60] flex max-h-[calc(100dvh-1rem)] flex-col items-end sm:bottom-6 sm:right-6",
        className
      )}
    >
      <div
        className={cn(
          "mb-3 flex max-h-[min(24rem,calc(100dvh-6.5rem))] w-[min(20rem,calc(100vw-2rem))] min-h-0 origin-bottom-right flex-col rounded-2xl border border-slate-200 bg-white shadow-xl transition-all duration-200 dark:border-slate-700 dark:bg-slate-900 sm:w-80",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-2 scale-95 opacity-0"
        )}
        role="navigation"
        aria-label="Table of contents"
        aria-hidden={!open}
      >
        <div className="shrink-0 border-b border-slate-100 bg-slate-50/60 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/60">
          <p className="text-[11px] font-medium uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
            On this page
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {pageTitle}
          </p>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-indigo-500 transition-[width] duration-150"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>

        <nav
          ref={navRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-3 pr-3 [-webkit-overflow-scrolling:touch]"
        >
          <ul className="relative ml-5 border-l border-slate-200 dark:border-slate-700">
            {numbered.map((item) => {
              const isActive = item.id === activeId;
              return (
                <li
                  key={item.id}
                  ref={isActive ? activeItemRef : undefined}
                  className="relative"
                >
                  <span
                    className={cn(
                      "absolute -left-[5px] top-1/2 h-[9px] w-[9px] -translate-y-1/2 rounded-full border-2 border-white transition-colors dark:border-slate-900",
                      isActive
                        ? "bg-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-900"
                        : "bg-slate-300 dark:bg-slate-600"
                    )}
                    aria-hidden
                  />
                  <button
                    type="button"
                    onClick={() => scrollTo(item.id)}
                    className={cn(
                      "flex w-full items-baseline gap-2.5 rounded-r-lg py-2 pl-4 pr-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300",
                      item.level === 3 && "pl-8",
                      isActive
                        ? "bg-indigo-50/70 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    )}
                  >
                    {item.no !== null && (
                      <span
                        className={cn(
                          "shrink-0 font-mono text-[11px] tabular-nums",
                          isActive ? "text-indigo-400" : "text-slate-400"
                        )}
                      >
                        {String(item.no).padStart(2, "0")}
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-sm leading-snug",
                        isActive ? "font-medium" : "",
                        item.level === 3 && "text-[13px]"
                      )}
                    >
                      {item.text}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close table of contents" : "Open table of contents"}
        className="group relative inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition-all hover:scale-105 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-indigo-400"
      >
        <svg
          className="absolute inset-0 h-full w-full -rotate-90"
          viewBox="0 0 56 56"
          aria-hidden
        >
          <circle
            cx="28"
            cy="28"
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-slate-100 dark:text-slate-800"
          />
          <circle
            cx="28"
            cy="28"
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - progress)}
            className="text-indigo-500 transition-[stroke-dashoffset] duration-150"
          />
        </svg>
        <span className="relative">
          {open ? (
            <X className="h-5 w-5" />
          ) : (
            <ListTree className="h-5 w-5" />
          )}
        </span>
      </button>
    </div>
  );

  return createPortal(ui, document.body);
}
