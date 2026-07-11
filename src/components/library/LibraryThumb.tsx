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

export function LibraryThumb({
  seed,
  size = "md",
}: {
  seed: string;
  size?: "sm" | "md" | "lg";
}) {
  const { bg } = getTileColors(seed);
  const Icon = iconFor(seed);
  const box =
    size === "lg"
      ? "h-12 w-12 rounded-xl"
      : size === "sm"
        ? "h-9 w-9 rounded-lg"
        : "h-10 w-10 rounded-xl";
  const iconSize = size === "lg" ? 22 : size === "sm" ? 15 : 18;

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden ${box}`}
      style={{ background: bg }}
    >
      <Icon
        size={iconSize}
        strokeWidth={2.25}
        className="relative text-white"
      />
    </div>
  );
}

export function LibraryThumbHero({ seed }: { seed: string }) {
  const { bg } = getTileColors(seed);
  const Icon = iconFor(seed);

  return (
    <div
      className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl sm:h-20 sm:w-20"
      style={{ background: bg }}
    >
      <Icon
        size={32}
        strokeWidth={2.25}
        className="relative text-white"
      />
    </div>
  );
}
