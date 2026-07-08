"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  DEFAULT_TAB,
  examTabPath,
} from "@/lib/routes";
import {
  loadBrowseFilters,
  saveBrowseFilters,
} from "@/lib/browse-filters";

const SUBJECTS = [
  "Anatomy",
  "Physiology",
  "Pharmacology",
  "Pathology",
  "Biochemistry",
  "Microbiology",
  "Surgery",
  "Internal Medicine",
];

const STATUSES = [
  { id: "used", label: "Used" },
  { id: "unused", label: "Unused" },
  { id: "incorrect", label: "Incorrect" },
  { id: "bookmark", label: "Bookmark" },
];

const TAGS = [
  "High Yield",
  "Exam Ready",
  "Review Needed",
  "Master",
  "Week 1",
  "Week 2",
  "Week 3",
  "Week 4",
];

export function ExamFiltersClient({ examId }: { examId: string }) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<Set<string>>(new Set());
  const [tags, setTags] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = loadBrowseFilters();
    setSubjects(new Set(saved.subjects));
    setStatuses(new Set(saved.statuses));
    setTags(new Set(saved.tags));
  }, []);

  const toggle = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    val: string
  ) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val);
      else next.add(val);
      return next;
    });

  const totalActive = subjects.size + statuses.size + tags.size;

  const applyFilters = () => {
    saveBrowseFilters({
      subjects: [...subjects],
      statuses: [...statuses],
      tags: [...tags],
    });
    router.push(examTabPath(examId, DEFAULT_TAB));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="bg-white" style={{ borderBottom: "3px solid #e2e8f0" }}>
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(examTabPath(examId, DEFAULT_TAB))}
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "#f1f5f9", border: "2px solid #e2e8f0" }}
            >
              <ArrowLeft size={17} strokeWidth={2.5} />
            </button>
            <h2 className="text-base font-black text-slate-900">Filters</h2>
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 py-6">
        <FilterSection
          label="Subject"
          options={SUBJECTS}
          selected={subjects}
          onToggle={(v) => toggle(setSubjects, v)}
        />
        <FilterSection
          label="Status"
          options={STATUSES.map((s) => s.label)}
          selected={statuses}
          onToggle={(v) => toggle(setStatuses, v)}
        />
        <FilterSection
          label="Tags"
          options={TAGS}
          selected={tags}
          onToggle={(v) => toggle(setTags, v)}
        />
      </div>
      <div className="border-t-2 border-slate-200 bg-white px-4 py-4">
        <button
          onClick={applyFilters}
          className="mx-auto block w-full max-w-2xl rounded-2xl py-4 font-black text-white"
          style={{
            background: "#58CC02",
            border: "2px solid #46A302",
            boxShadow: "0 4px 0 #46A302",
          }}
        >
          {totalActive > 0 ? `Apply ${totalActive} filter(s)` : "Show all"}
        </button>
      </div>
    </div>
  );
}

function FilterSection({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (v: string) => void;
}) {
  return (
    <div className="mb-7">
      <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.has(option);
          return (
            <button
              key={option}
              onClick={() => onToggle(option)}
              className="rounded-2xl border-2 px-4 py-2 text-sm font-bold"
              style={
                active
                  ? {
                      background: "#58CC02",
                      borderColor: "#46A302",
                      color: "#fff",
                    }
                  : {
                      background: "#fff",
                      borderColor: "#e2e8f0",
                      color: "#64748b",
                    }
              }
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
