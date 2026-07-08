"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DrNoteLogo } from "@/components/DrNoteLogo";
import { UserAuthControls } from "@/components/UserAuthControls";
import { HOME_PATH } from "@/lib/routes";

type AppHeaderProps = {
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
};

export function AppHeader({ showBack, onBack, title }: AppHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    router.back();
  };

  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="mx-auto grid h-14 max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          {showBack ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
          ) : null}
          <Link href={HOME_PATH} className="shrink-0">
            <DrNoteLogo size="sm" showWordmark forceWordmark />
          </Link>
        </div>

        {title ? (
          <p
            className="min-w-0 truncate text-center text-sm font-extrabold tracking-tight text-slate-900 sm:text-base"
            style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
          >
            {title}
          </p>
        ) : (
          <span />
        )}

        <div className="flex shrink-0 items-center justify-end">
          <UserAuthControls compact />
        </div>
      </div>
    </header>
  );
}
