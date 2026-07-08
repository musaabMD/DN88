"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <div className="flex w-9 shrink-0 items-center justify-start">
          {showBack ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
          ) : null}
        </div>

        <Link
          href={HOME_PATH}
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: "linear-gradient(135deg,#58CC02,#46A302)",
            }}
          >
            <span className="text-sm font-black leading-none text-white">D</span>
          </div>
          <span
            className="truncate text-base font-extrabold tracking-tight text-slate-900 sm:text-lg"
            style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
          >
            {title ?? "Drnote"}
          </span>
        </Link>

        <div className="flex shrink-0 items-center justify-end">
          <UserAuthControls compact />
        </div>
      </div>
    </header>
  );
}
