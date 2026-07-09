"use client";

import { useEffect, useState } from "react";
import { ListTree } from "lucide-react";

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
      <p className="mb-3 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-slate-400">
        <ListTree size={14} strokeWidth={2.5} />
        Contents
      </p>
      <ul className="space-y-1 border-l-2 border-slate-200 pl-3">
        {headings.map((heading) => {
          const id = sectionSlug(heading);
          const isActive = (current ?? activeId) === id;
          return (
            <li key={heading}>
              <a
                href={`#${id}`}
                className={`block rounded-lg py-1.5 pl-2 text-sm font-bold transition-colors ${
                  isActive
                    ? "border-l-2 border-slate-700 -ml-[calc(0.75rem+2px)] pl-[calc(0.5rem+2px)] text-slate-800"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {heading}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { sectionSlug };
