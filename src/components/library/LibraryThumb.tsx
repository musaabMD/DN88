"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bone,
  Brain,
  Dna,
  Droplets,
  Ear,
  Eye,
  Heart,
  Microscope,
  Pill,
  Shield,
  Stethoscope,
  Baby,
  Scissors,
  Moon,
  Apple,
  Users,
  Cross,
} from "lucide-react";
import { getTileColors } from "@/lib/tile-colors";

const SPECIALTY_ICONS: Array<{ match: RegExp; icon: LucideIcon }> = [
  { match: /cardio|heart|vascular/i, icon: Heart },
  { match: /neuro|brain|psych/i, icon: Brain },
  { match: /pulm|respir|sleep|lung/i, icon: Activity },
  { match: /derm|skin/i, icon: Droplets },
  { match: /ophth|eye/i, icon: Eye },
  { match: /ent|ear|nose|throat/i, icon: Ear },
  { match: /ortho|bone|rheum/i, icon: Bone },
  { match: /infect|immun|allerg/i, icon: Shield },
  { match: /endocr|metabol/i, icon: Pill },
  { match: /haemat|hemat|blood|oncolog/i, icon: Dna },
  { match: /nephro|kidney|urolog/i, icon: Droplets },
  { match: /gastro|hepat|nutrition/i, icon: Apple },
  { match: /paediat|pediatr|neonat|adolescent/i, icon: Baby },
  { match: /obstet|gynaec|gynec|women/i, icon: Users },
  { match: /surg|anaesth|anesth|critical|emergency|trauma/i, icon: Scissors },
  { match: /palliative|geriatr|hospital|primary|internal|health/i, icon: Cross },
  { match: /genetics/i, icon: Microscope },
  { match: /sleep/i, icon: Moon },
];

function iconFor(seed: string): LucideIcon {
  for (const entry of SPECIALTY_ICONS) {
    if (entry.match.test(seed)) return entry.icon;
  }
  return Stethoscope;
}

function patternId(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 4;
}

function ThumbPattern({ variant }: { variant: number }) {
  if (variant === 0) {
    return (
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full opacity-25"
        viewBox="0 0 48 48"
      >
        {[8, 24, 40].map((x) =>
          [8, 24, 40].map((y) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="white" />
          ))
        )}
      </svg>
    );
  }
  if (variant === 1) {
    return (
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full opacity-20"
        viewBox="0 0 48 48"
      >
        <path d="M0 12h48M0 24h48M0 36h48" stroke="white" strokeWidth="2" />
      </svg>
    );
  }
  if (variant === 2) {
    return (
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full opacity-20"
        viewBox="0 0 48 48"
      >
        <path
          d="M-8 8l64 64M-8 24l64 64M-8 -8l64 64M-8 40l64 64"
          stroke="white"
          strokeWidth="3"
        />
      </svg>
    );
  }
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full opacity-20"
      viewBox="0 0 48 48"
    >
      <circle cx="36" cy="12" r="14" fill="white" />
      <circle cx="10" cy="40" r="10" fill="white" />
    </svg>
  );
}

export function LibraryThumb({
  seed,
  size = "md",
}: {
  seed: string;
  size?: "sm" | "md" | "lg";
}) {
  const { bg, border } = getTileColors(seed);
  const Icon = iconFor(seed);
  const variant = patternId(seed);
  const box =
    size === "lg"
      ? "h-14 w-14 rounded-2xl"
      : size === "sm"
        ? "h-10 w-10 rounded-xl"
        : "h-12 w-12 rounded-2xl";
  const iconSize = size === "lg" ? 24 : size === "sm" ? 16 : 20;

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border-b-4 ${box}`}
      style={{ background: bg, borderColor: border }}
    >
      <ThumbPattern variant={variant} />
      <Icon
        size={iconSize}
        strokeWidth={2.5}
        className="relative text-white drop-shadow-sm"
      />
    </div>
  );
}

export function LibraryThumbHero({ seed }: { seed: string }) {
  const { bg, border } = getTileColors(seed);
  const Icon = iconFor(seed);
  const variant = patternId(seed);

  return (
    <div
      className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-b-4 sm:h-24 sm:w-24"
      style={{ background: bg, borderColor: border }}
    >
      <ThumbPattern variant={variant} />
      <Icon
        size={36}
        strokeWidth={2.25}
        className="relative text-white drop-shadow-sm"
      />
    </div>
  );
}
