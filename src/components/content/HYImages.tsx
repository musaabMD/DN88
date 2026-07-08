"use client";

import { useMemo, useState } from "react";
import {
  Expand,
  Image as ImageIcon,
  Search,
  X,
  Zap,
} from "lucide-react";
import type { ImageItem } from "@/lib/set-content";

function ImageFrame({ image, tall }: { image: ImageItem; tall?: boolean }) {
  if (image.src) {
    return (
      <img
        src={image.src}
        alt={image.title}
        className={`w-full rounded-xl object-cover ${tall ? "max-h-96" : "h-40"}`}
      />
    );
  }
  return (
    <div
      className={`flex w-full items-center justify-center rounded-xl bg-slate-100 ${
        tall ? "h-72" : "h-40"
      }`}
    >
      <ImageIcon
        size={tall ? 48 : 32}
        strokeWidth={2}
        className="text-slate-300"
      />
    </div>
  );
}

function ImageCard({
  image,
  onOpen,
}: {
  image: ImageItem;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full rounded-2xl border-2 border-b-4 border-slate-200 bg-white p-3 text-left transition-colors duration-150 hover:bg-slate-50 active:translate-y-0.5 active:border-b-2"
    >
      <div className="relative">
        <ImageFrame image={image} />
        <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <Expand size={15} strokeWidth={2.5} />
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-xs font-extrabold uppercase tracking-wide text-white">
          <Zap size={11} strokeWidth={3} />
          HY
        </span>
        <span className="rounded-full border-2 border-slate-200 px-2 py-0.5 text-xs font-extrabold text-slate-400">
          {image.tag}
        </span>
      </div>

      <h3 className="mt-2 truncate text-sm font-extrabold tracking-tight text-slate-700">
        {image.title}
      </h3>
    </button>
  );
}

function ImageViewer({
  image,
  onClose,
}: {
  image: ImageItem;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-white">
      <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
            <Zap size={12} strokeWidth={3} />
            HY image
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close image"
            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-b-4 border-slate-200 bg-white text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 active:translate-y-0.5 active:border-b-2"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-center py-8">
          <ImageFrame image={image} tall />
          <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-800">
            {image.title}
          </h2>
          <p className="mt-2 text-base font-bold leading-relaxed text-slate-500">
            {image.caption}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HYImages({ images }: { images: ImageItem[] }) {
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [open, setOpen] = useState<ImageItem | null>(null);

  const tags = useMemo(() => [...new Set(images.map((i) => i.tag))], [images]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return images.filter((img) => {
      if (tagFilter && img.tag !== tagFilter) return false;
      if (!q) return true;
      return (
        img.title.toLowerCase().includes(q) ||
        img.caption.toLowerCase().includes(q) ||
        img.tag.toLowerCase().includes(q)
      );
    });
  }, [images, query, tagFilter]);

  return (
    <div>
      <div className="mx-auto mb-4 flex max-w-4xl items-center gap-3 rounded-2xl border-2 border-b-4 border-slate-200 bg-white px-4 py-2.5">
        <Search size={18} strokeWidth={2.5} className="shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search images"
          className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="mx-auto mb-6 flex max-w-4xl flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTagFilter(null)}
            className={`rounded-full border-2 px-3 py-1 text-xs font-extrabold transition-colors ${
              tagFilter === null
                ? "border-green-500 bg-green-500 text-white"
                : "border-slate-200 text-slate-500 hover:border-green-500 hover:text-green-600"
            }`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setTagFilter(tag)}
              className={`rounded-full border-2 px-3 py-1 text-xs font-extrabold transition-colors ${
                tagFilter === tag
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-slate-200 text-slate-500 hover:border-green-500 hover:text-green-600"
              }`}
            >
              {tag}
            </button>
          ))}
      </div>

      <div className="mx-auto w-full max-w-4xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((img) => (
            <ImageCard key={img.id} image={img} onOpen={() => setOpen(img)} />
          ))}
        </div>
      </div>

      {open && <ImageViewer image={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
