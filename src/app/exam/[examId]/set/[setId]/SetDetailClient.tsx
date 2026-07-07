"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getExam, getSet } from "@/lib/data";
import type { DetailTab, ViewMode } from "@/lib/types";
import SearchBox from "@/components/SearchBox";
import ProgressBar from "@/components/ProgressBar";
import ViewModePicker from "@/components/ViewModePicker";
import ContentViewer from "@/components/ContentViewer";

const tabs: { id: DetailTab; label: string }[] = [
  { id: "learn", label: "Learn" },
  { id: "mcqs", label: "MCQs" },
  { id: "review", label: "Review" },
];

export default function SetDetailClient({
  examId,
  setId,
}: {
  examId: string;
  setId: string;
}) {
  const exam = getExam(examId);
  const set = getSet(setId);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<DetailTab>("learn");
  const [viewMode, setViewMode] = useState<ViewMode | null>(null);

  const title = useMemo(() => {
    if (!set) return "";
    return set.title;
  }, [set]);

  if (!exam || !set) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <p className="text-sm font-semibold text-muted">Not found</p>
        <Link href="/" className="mt-4 inline-block text-sm font-bold text-primary">
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-10 pt-4">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <h1 className="mb-2 text-center text-2xl font-extrabold text-foreground">
        {title}
      </h1>
      <p className="mb-5 text-center text-xs font-semibold text-muted">
        {exam.title}
      </p>

      <div className="mb-5">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search..."
        />
      </div>

      <div className="card-shadow mb-6 rounded-3xl bg-card p-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-bold text-muted">Progress</span>
          <span className="text-sm font-extrabold text-primary">{set.score}%</span>
        </div>
        <ProgressBar progress={set.progress} />
      </div>

      <div className="mb-5 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setViewMode(null);
            }}
            className={`flex-1 rounded-2xl py-2.5 text-sm font-extrabold transition ${
              activeTab === tab.id
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "bg-white text-muted card-shadow"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-5">
        <ViewModePicker mode={viewMode} onSelect={setViewMode} />
      </div>

      {viewMode && (
        <ContentViewer
          key={`${activeTab}-${viewMode}`}
          tab={activeTab}
          viewMode={viewMode}
          learnItems={set.learnItems}
          mcqItems={set.mcqItems}
          reviewItems={set.reviewItems}
          search={search}
        />
      )}
    </div>
  );
}
