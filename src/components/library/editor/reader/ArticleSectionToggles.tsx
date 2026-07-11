"use client";

import { useEffect } from "react";

/**
 * Notion-style collapsible section headings. Toggles visibility of content
 * below each h2 via the `hidden` attribute — never reparents TipTap DOM nodes.
 */
export function ArticleSectionToggles({
  containerSelector = ".simple-editor-scroll",
  contentKey = 0,
}: {
  containerSelector?: string;
  contentKey?: number;
}) {
  useEffect(() => {
    const container = document.querySelector<HTMLElement>(containerSelector);
    if (!container) return;

    const cleanups: Array<() => void> = [];

    const headings = container.querySelectorAll<HTMLElement>(
      "h2.article-section-heading"
    );

    headings.forEach((heading) => {
      if (heading.dataset.toggleReady === "true") return;

      const sectionNodes: HTMLElement[] = [];
      let sibling = heading.nextElementSibling;
      while (sibling && !sibling.matches("h2.article-section-heading")) {
        sectionNodes.push(sibling as HTMLElement);
        sibling = sibling.nextElementSibling;
      }
      if (sectionNodes.length === 0) return;

      heading.dataset.toggleReady = "true";
      heading.classList.add("is-collapsible");
      heading.setAttribute("role", "button");
      heading.setAttribute("tabindex", "0");
      heading.setAttribute("aria-expanded", "true");

      const toggle = () => {
        const collapsed = heading.classList.toggle("is-collapsed");
        heading.setAttribute("aria-expanded", String(!collapsed));
        for (const node of sectionNodes) {
          node.hidden = collapsed;
        }
      };

      const onClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (target.closest("a, button, .reader-anchor-btn")) return;
        toggle();
      };

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggle();
        }
      };

      heading.addEventListener("click", onClick);
      heading.addEventListener("keydown", onKeyDown);

      cleanups.push(() => {
        heading.removeEventListener("click", onClick);
        heading.removeEventListener("keydown", onKeyDown);
        for (const node of sectionNodes) {
          node.hidden = false;
        }
        heading.classList.remove("is-collapsible", "is-collapsed");
        heading.removeAttribute("role");
        heading.removeAttribute("tabindex");
        heading.removeAttribute("aria-expanded");
        delete heading.dataset.toggleReady;
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [containerSelector, contentKey]);

  return null;
}
