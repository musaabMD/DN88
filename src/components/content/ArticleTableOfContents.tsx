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
        { rootMargin: "-15% 0px -65% 0px", threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, [headings]);

  return (
    <nav
      className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto"
      aria-label="Table of contents"
    >
      <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
        Contents
      </p>
      <ol className="relative space-y-0 border-l-2 border-slate-200">
        {headings.map((heading) => {
          const id = sectionSlug(heading);
          const isActive = (current ?? activeId) === id;
          return (
            <li key={heading} className="relative">
              <a
                href={`#${id}`}
                className={`-ml-[2px] block border-l-2 py-2 pl-4 text-[13px] font-bold leading-snug transition-colors ${
                  isActive
                    ? "border-slate-800 text-slate-900"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                {heading}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export { sectionSlug };
