"use client";

import { useEffect, useState } from "react";

function sectionSlug(heading: string): string {
  return heading.toLowerCase().replace(/ /g, "-");
}

export function ArticleTableOfContents({
  headings,
  activeId,
}: {
  headings: string[];
  activeId: string | null;
}) {
  const [current, setCurrent] = useState(activeId);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    for (const heading of headings) {
      const id = sectionSlug(heading);
      const el = document.getElementById(id);
      if (!el) continue;

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setCurrent(id);
            }
          }
        },
        { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, [headings]);

  return (
    <nav
      className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto"
      aria-label="Table of contents"
    >
      <div className="rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-3">
        <p className="mb-2 px-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
          On this page
        </p>
        <ol className="space-y-0.5">
          {headings.map((heading, index) => {
            const id = sectionSlug(heading);
            const isActive = (current ?? activeId) === id;
            return (
              <li key={heading}>
                <a
                  href={`#${id}`}
                  className={`group flex items-start gap-2.5 rounded-xl px-2 py-2 transition-colors ${
                    isActive
                      ? "bg-slate-700 text-white"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-[10px] font-black tabular-nums ${
                      isActive
                        ? "bg-white text-slate-700"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="text-[13px] font-bold leading-snug">
                    {heading}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

export { sectionSlug };
