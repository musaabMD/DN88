"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BottomTabBar } from "@/components/BottomTabBar";
import { BrowseHeader } from "@/components/BrowseHeader";
import {
  BROWSE_DAILY_LIMIT,
  BROWSE_DAILY_USED,
  BROWSE_STREAK,
  DailyPopup,
  StatsPopup,
} from "@/components/BrowseGamificationPopups";
import { saveCurrentExamId } from "@/lib/current-exam";
import {
  countBrowseFilters,
  loadBrowseFilters,
  saveBrowseFilters,
} from "@/lib/browse-filters";
import {
  DEFAULT_TAB,
  examTabPath,
  UPGRADE_PATH,
  type ContentTab,
} from "@/lib/routes";

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

const PAGE_SHELL =
  "w-full max-w-2xl mx-auto px-4 md:max-w-none md:mx-0 md:px-8 lg:px-12 xl:px-16";

export function ExamFiltersClient({ examId }: { examId: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statsOpen, setStatsOpen] = useState(false);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [subjects, setSubjects] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<Set<string>>(new Set());
  const [tags, setTags] = useState<Set<string>>(new Set());

  useEffect(() => {
    saveCurrentExamId(examId);
  }, [examId]);

  useEffect(() => {
    const saved = loadBrowseFilters();
    setSubjects(new Set(saved.subjects));
    setStatuses(new Set(saved.statuses));
    setTags(new Set(saved.tags));
  }, []);

  const totalFilters = countBrowseFilters({
    subjects: [...subjects],
    statuses: [...statuses],
    tags: [...tags],
  });

  const dailyRemaining = BROWSE_DAILY_LIMIT - BROWSE_DAILY_USED;

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

  const applyFilters = () => {
    saveBrowseFilters({
      subjects: [...subjects],
      statuses: [...statuses],
      tags: [...tags],
    });
    router.push(examTabPath(examId, DEFAULT_TAB));
  };

  const handleTabChange = (tab: ContentTab) => {
    router.push(examTabPath(examId, tab));
  };

  return (
    <div className="min-h-screen bg-white font-sans pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
      <BrowseHeader
        search={search}
        setSearch={setSearch}
        activeTab={DEFAULT_TAB}
        onTabChange={handleTabChange}
        totalFilters={totalFilters}
        streak={BROWSE_STREAK}
        dailyRemaining={dailyRemaining}
        onStatsOpen={() => setStatsOpen(true)}
        onDailyOpen={() => setDailyOpen(true)}
        onUpgradeOpen={() => router.push(UPGRADE_PATH)}
        onFilterOpen={() => {}}
        hideFilterButton
      />

      <main className={`${PAGE_SHELL} py-4`}>
        <h1 className="mb-6 text-xl font-black text-slate-900">Filters</h1>

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

        <button
          onClick={applyFilters}
          className="mt-2 w-full rounded-2xl py-4 font-black text-white"
          style={{
            background: "#58CC02",
            border: "2px solid #46A302",
            boxShadow: "0 4px 0 #46A302",
          }}
        >
          {totalFilters > 0 ? `Apply ${totalFilters} filter(s)` : "Show all"}
        </button>
      </main>

      <BottomTabBar />

      {statsOpen ? (
        <StatsPopup streak={BROWSE_STREAK} onClose={() => setStatsOpen(false)} />
      ) : null}
      {dailyOpen ? (
        <DailyPopup
          used={BROWSE_DAILY_USED}
          limit={BROWSE_DAILY_LIMIT}
          onUpgrade={() => {
            setDailyOpen(false);
            router.push(UPGRADE_PATH);
          }}
          onClose={() => setDailyOpen(false)}
        />
      ) : null}
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
              type="button"
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
