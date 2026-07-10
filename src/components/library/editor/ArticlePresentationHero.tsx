"use client";

import { DrNoteLogo } from "@/components/DrNoteLogo";

export function ArticlePresentationHero({
  title,
  subject,
  readMinutes,
}: {
  title: string;
  subject: string;
  readMinutes: number;
}) {
  return (
    <div className="article-presentation-hero">
      <DrNoteLogo showWordmark forceWordmark lightWordmark />
      <h1 className="article-presentation-title">{title}</h1>
      <p className="article-presentation-meta">
        {subject} · {readMinutes} min read
      </p>
    </div>
  );
}
