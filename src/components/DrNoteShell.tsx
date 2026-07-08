"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
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
import { examTabPath, filtersPath, UPGRADE_PATH, type ContentTab } from "@/lib/routes";

export const PAGE_SHELL =
  "w-full max-w-2xl mx-auto px-4 md:max-w-none md:mx-0 md:px-8 lg:px-12 xl:px-16";

export function DrNoteShell({
  examId,
  activeTab,
  children,
  hideFilterButton = true,
}: {
  examId: string;
  activeTab: ContentTab;
  children: ReactNode;
  hideFilterButton?: boolean;
}) {
  const router = useRouter();
  const [statsOpen, setStatsOpen] = useState(false);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    saveCurrentExamId(examId);
  }, [examId]);

  const dailyRemaining = BROWSE_DAILY_LIMIT - BROWSE_DAILY_USED;

  return (
    <div className="min-h-screen bg-white font-sans pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
      <BrowseHeader
        search={search}
        setSearch={setSearch}
        activeTab={activeTab}
        onTabChange={(tab) => router.push(examTabPath(examId, tab))}
        totalFilters={0}
        streak={BROWSE_STREAK}
        dailyRemaining={dailyRemaining}
        onStatsOpen={() => setStatsOpen(true)}
        onDailyOpen={() => setDailyOpen(true)}
        onUpgradeOpen={() => router.push(UPGRADE_PATH)}
        onFilterOpen={() => router.push(filtersPath(examId))}
        hideFilterButton={hideFilterButton}
      />

      <main className={`${PAGE_SHELL} py-4`}>{children}</main>

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
