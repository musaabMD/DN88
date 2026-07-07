"use client";

import Link from "next/link";
import {
  BookOpen,
  HelpCircle,
  Flag,
  Share2,
  Pin,
  Play,
  RotateCcw,
} from "lucide-react";
import type { StudySet } from "@/lib/types";
import UserAvatar from "./UserAvatar";
import ProgressBar from "./ProgressBar";
import RatingButton from "./RatingButton";

interface SetCardProps {
  set: StudySet;
  examId: string;
}

export default function SetCard({ set, examId }: SetCardProps) {
  const isMcq = set.type === "mcq";

  return (
    <div className="card-shadow rounded-3xl bg-card p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <Link href={`/exam/${examId}/set/${set.id}`} className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            {isMcq ? (
              <HelpCircle className="h-4 w-4 text-primary" />
            ) : (
              <BookOpen className="h-4 w-4 text-primary" />
            )}
            <span className="text-xs font-bold uppercase tracking-wide text-primary">
              {isMcq ? "MCQs" : "Learning"}
            </span>
          </div>
          <h3 className="text-base font-extrabold leading-tight text-foreground">
            {set.title}
          </h3>
        </Link>
        <RatingButton initialRating={set.rating} />
      </div>

      <div className="mb-3 flex items-center gap-2">
        <UserAvatar user={set.user} />
        <span className="text-xs font-semibold text-muted">@{set.user.username}</span>
      </div>

      <div className="mb-1 flex items-center justify-between">
        <ProgressBar progress={set.progress} size="sm" />
        <span className="ml-3 shrink-0 text-sm font-extrabold text-primary">
          {set.score}%
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            className="rounded-full p-2 text-muted transition hover:bg-primary-light hover:text-primary"
            aria-label="Report"
          >
            <Flag className="h-4 w-4" />
          </button>
          <button
            className="rounded-full p-2 text-muted transition hover:bg-primary-light hover:text-primary"
            aria-label="Share"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            className={`rounded-full p-2 transition ${
              set.pinned
                ? "bg-primary-light text-primary"
                : "text-muted hover:bg-primary-light hover:text-primary"
            }`}
            aria-label="Pin"
          >
            <Pin className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs">
            <RotateCcw className="h-3.5 w-3.5" />
            Restart
          </button>
          <Link
            href={`/exam/${examId}/set/${set.id}`}
            className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs"
          >
            <Play className="h-3.5 w-3.5" />
            Continue
          </Link>
        </div>
      </div>
    </div>
  );
}
