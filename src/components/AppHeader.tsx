"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserAuthControls } from "@/components/UserAuthControls";
import { HOME_PATH } from "@/lib/routes";

const PAGE_SHELL = "mx-auto w-full max-w-md px-5";

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
    <header className="sticky top-0 z-40 border-b border-[#E5E5E5] bg-white">
      <div className={`${PAGE_SHELL} flex min-h-[52px] items-center gap-3 py-2`}>
        <div className="flex w-10 shrink-0 items-center justify-start">
          {showBack ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-b-4 border-[#E5E5E5] text-[#AFAFAF] transition-all hover:bg-[#F7F7F7] active:translate-y-[2px] active:border-b-2"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
          ) : null}
        </div>

        <Link
          href={HOME_PATH}
          className="flex min-w-0 flex-1 items-center justify-center gap-2.5 sm:justify-start"
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: "linear-gradient(135deg,#58CC02,#46A302)",
              boxShadow: "0 2px 0 #3a8200",
            }}
          >
            <span className="text-base font-black leading-none text-white">D</span>
          </div>
          <span
            className="truncate text-[1.15rem] font-extrabold tracking-[-0.04em] text-slate-900"
            style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
          >
            {title ?? "Drnote"}
          </span>
        </Link>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <UserAuthControls />
        </div>
      </div>
    </header>
  );
}
