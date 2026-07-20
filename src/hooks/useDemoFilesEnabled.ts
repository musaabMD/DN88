"use client";

import { useSyncExternalStore } from "react";
import { isDemoFilesEnabled } from "@/lib/medgenius/demo-files";

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
}

function getSnapshot(): boolean {
  return isDemoFilesEnabled();
}

function getServerSnapshot(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_FILES === "true";
}

/** True when `?demo=1` is in the URL or NEXT_PUBLIC_DEMO_FILES=true. */
export function useDemoFilesEnabled(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
