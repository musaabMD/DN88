"use client";

import type { LucideIcon } from "lucide-react";
import {
  Crown,
  Flame,
  Heart,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { NAV_TABS } from "@/lib/nav-tabs";
import { HOME_PATH, type ContentTab } from "@/lib/routes";
import { UserAuthControls } from "@/components/UserAuthControls";
import { cn } from "@/lib/utils";

function HeaderStatButton({
  onClick,
  icon: Icon,
  label,
  ariaLabel,
  colors,
  compact = false,
}: {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  ariaLabel: string;
  colors: {
    background: string;
    border: string;
    shadow: string;
    text: string;
    icon: string;
  };
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "flex shrink-0 items-center rounded-xl font-black transition-transform active:translate-y-0.5",
        compact ? "h-9 min-w-9 justify-center px-2" : "gap-1.5 px-3 py-2 text-sm"
      )}
      style={{
        background: colors.background,
        border: `2px solid ${colors.border}`,
        boxShadow: `0 2px 0 ${colors.shadow}`,
        color: colors.text,
      }}
    >
      <Icon size={16} strokeWidth={2.5} style={{ color: colors.icon }} />
      {!compact && label}
    </button>
  );
}

function SearchField({
  search,
  setSearch,
  className,
}: {
  search: string;
  setSearch: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-colors focus-within:border-[#58CC02] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#58CC02]/20",
        className
      )}
    >
      <Search
        className="ml-3 h-4 w-4 shrink-0 text-slate-400"
        strokeWidth={2.5}
      />
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search sets..."
        className="min-w-0 flex-1 bg-transparent px-2.5 py-2.5 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
      />
      {search ? (
        <button
          type="button"
          onClick={() => setSearch("")}
          aria-label="Clear search"
          className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  );
}

export function BrowseHeader({
  search,
  setSearch,
  activeTab,
  onTabChange,
  totalFilters,
  streak,
  dailyRemaining,
  onStatsOpen,
  onDailyOpen,
  onUpgradeOpen,
  onFilterOpen,
}: {
  search: string;
  setSearch: (value: string) => void;
  activeTab: ContentTab;
  onTabChange: (tab: ContentTab) => void;
  totalFilters: number;
  streak: number;
  dailyRemaining: number;
  onStatsOpen: () => void;
  onDailyOpen: () => void;
  onUpgradeOpen: () => void;
  onFilterOpen: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link href={HOME_PATH} className="flex min-w-0 shrink-0 items-center">
            <DrNoteLogo showWordmark />
          </Link>

          <div className="hidden min-w-0 flex-1 px-4 md:block lg:px-8">
            <SearchField search={search} setSearch={setSearch} />
          </div>

          <div className="hidden shrink-0 items-center gap-1.5 md:flex">
            <HeaderStatButton
              onClick={onStatsOpen}
              icon={Flame}
              label={String(streak)}
              ariaLabel="View streak"
              compact
              colors={{
                background: "#fff7ed",
                border: "#fdba74",
                shadow: "#fb923c",
                text: "#c2410c",
                icon: "#f97316",
              }}
            />
            <HeaderStatButton
              onClick={onDailyOpen}
              icon={Heart}
              label={String(dailyRemaining)}
              ariaLabel="View daily limit"
              compact
              colors={{
                background: dailyRemaining <= 3 ? "#fef2f2" : "#fff",
                border: dailyRemaining <= 3 ? "#fecaca" : "#e5e7eb",
                shadow: dailyRemaining <= 3 ? "#fca5a5" : "#d1d5db",
                text: dailyRemaining <= 3 ? "#dc2626" : "#475569",
                icon: dailyRemaining <= 3 ? "#ef4444" : "#ff4b4b",
              }}
            />
            <HeaderStatButton
              onClick={onUpgradeOpen}
              icon={Crown}
              label="Pro"
              ariaLabel="Upgrade to Pro"
              colors={{
                background: "linear-gradient(135deg,#ddd6fe,#c4b5fd)",
                border: "#a78bfa",
                shadow: "#8b5cf6",
                text: "#5b21b6",
                icon: "#7c3aed",
              }}
            />
          </div>

          <UserAuthControls />
        </div>

        <div className="mt-3 flex items-center gap-2 md:hidden">
          <SearchField search={search} setSearch={setSearch} className="flex-1" />
          {totalFilters === 0 ? (
            <button
              type="button"
              onClick={onFilterOpen}
              aria-label="Filters"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500"
            >
              <SlidersHorizontal size={16} strokeWidth={2.5} />
            </button>
          ) : null}
        </div>

        <nav
          aria-label="Browse sections"
          className="mt-3 hidden justify-center gap-1 overflow-x-auto pb-0.5 scrollbar-hide md:flex"
        >
          {NAV_TABS.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-bold transition-colors",
                  active
                    ? "bg-[#58CC02] text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2.5} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
