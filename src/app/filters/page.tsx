"use client";

import { AppHeader } from "@/components/AppHeader";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEFAULT_TAB, tabPath } from "@/lib/routes";

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

export default function FiltersPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<Set<string>>(new Set());
  const [tags, setTags] = useState<Set<string>>(new Set());

  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, val: string) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val);
      else next.add(val);
      return next;
    });

  const totalActive = subjects.size + statuses.size + tags.size;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <AppHeader
        showBack
        onBack={() => router.push(tabPath(DEFAULT_TAB))}
        title="Filters"
      />
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
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
      <div className="bg-white py-4 border-t-2 border-slate-200 px-4">
        <button
          onClick={() => router.push(tabPath(DEFAULT_TAB))}
          className="w-full max-w-2xl mx-auto block text-white font-black py-4 rounded-2xl"
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
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.has(option);
          return (
            <button
              key={option}
              onClick={() => onToggle(option)}
              className="px-4 py-2 rounded-2xl text-sm font-bold border-2"
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
