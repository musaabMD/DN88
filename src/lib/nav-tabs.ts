import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  FileQuestion,
  FileText,
  Image,
} from "lucide-react";
import type { ContentTab } from "@/lib/routes";

export type NavTab = {
  id: ContentTab;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};

export const NAV_TABS: NavTab[] = [
  { id: "questions", label: "Questions", shortLabel: "Practice", icon: FileQuestion },
  { id: "summary", label: "Notes", shortLabel: "Notes", icon: FileText },
  { id: "images", label: "Images", shortLabel: "Images", icon: Image },
  { id: "flashcards", label: "Cards", shortLabel: "Cards", icon: CreditCard },
];
