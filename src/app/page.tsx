import { redirect } from "next/navigation";
import { DEFAULT_TAB, tabPath } from "@/lib/routes";

export default function HomePage() {
  redirect(tabPath(DEFAULT_TAB));
}
