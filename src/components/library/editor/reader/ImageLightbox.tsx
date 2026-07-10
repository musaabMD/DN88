"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Click-to-zoom lightbox for images inside the article body. Listens on the
 * scroll container so it works for any rendered `<img>` without markup changes.
 */
export function ImageLightbox({
  containerSelector = ".simple-editor-scroll",
}: {
  containerSelector?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [alt, setAlt] = useState("");

  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const onClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const img = target?.closest?.("img");
      if (!img || !(img instanceof HTMLImageElement)) return;
      event.preventDefault();
      setSrc(img.currentSrc || img.src);
      setAlt(img.alt ?? "");
    };

    container.addEventListener("click", onClick);
    return () => container.removeEventListener("click", onClick);
  }, [containerSelector]);

  useEffect(() => {
    if (!src) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSrc(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [src]);

  if (!src || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="reader-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={alt || "Image preview"}
      onClick={() => setSrc(null)}
    >
      <button
        type="button"
        className="reader-lightbox-close"
        aria-label="Close image"
        onClick={() => setSrc(null)}
      >
        <X size={22} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="reader-lightbox-img"
        onClick={(event) => event.stopPropagation()}
      />
      {alt ? <p className="reader-lightbox-caption">{alt}</p> : null}
    </div>,
    document.body
  );
}
