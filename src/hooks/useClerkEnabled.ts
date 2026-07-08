"use client";

import { useSyncExternalStore } from "react";
import { isClerkActiveForHost } from "@/lib/clerk";

function subscribe(): () => void {
  return () => {};
}

function getClerkEnabledSnapshot(): boolean {
  return isClerkActiveForHost(window.location.hostname);
}

function getClerkEnabledServerSnapshot(): boolean {
  return false;
}

/** True when the current hostname should use Clerk (drnote.co, not pages.dev). */
export function useClerkEnabled(): boolean {
  return useSyncExternalStore(
    subscribe,
    getClerkEnabledSnapshot,
    getClerkEnabledServerSnapshot
  );
}

/** True after the client has mounted (avoids hydration mismatch with Clerk UI). */
export function useClientMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
