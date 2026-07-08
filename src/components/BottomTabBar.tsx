"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_TABS } from "@/lib/nav-tabs";
import { HOME_PATH, tabPath, type ContentTab } from "@/lib/routes";
import { cn } from "@/lib/utils";

function tabHref(tab: ContentTab): string {
  return tab === "questions" ? HOME_PATH : tabPath(tab);
}

function activeTabFromPath(pathname: string): ContentTab {
  const segment = pathname.split("/").filter(Boolean)[0];
  const match = NAV_TABS.find((tab) => tab.id === segment);
  return match?.id ?? "questions";
}

export function BottomTabBar() {
  const pathname = usePathname();
  const activeTab = activeTabFromPath(pathname);

  return (
    <nav
      aria-label="Browse sections"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {NAV_TABS.map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={tabHref(tab.id)}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 transition-colors",
                active ? "text-[#58CC02]" : "text-slate-400"
              )}
            >
              <Icon
                className="h-5 w-5 shrink-0"
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className={cn(
                  "max-w-full truncate text-[10px] font-bold leading-none",
                  active ? "text-[#46A302]" : "text-slate-500"
                )}
              >
                {tab.shortLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
