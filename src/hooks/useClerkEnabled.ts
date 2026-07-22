"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  ensureClerkRuntimeConfig,
  getClerkRuntimeServerSnapshot,
  getClerkRuntimeSnapshot,
  isClerkRuntimeActiveForHost,
  subscribeClerkRuntime,
} from "@/lib/clerk-runtime";

function getClerkEnabledSnapshot(): boolean {
  return isClerkRuntimeActiveForHost(window.location.hostname);
}

function getClerkEnabledServerSnapshot(): boolean {
  return false;
}

/** True when the current hostname should use Clerk (drnote.co, not pages.dev). */
export function useClerkEnabled(): boolean {
  useEffect(() => {
    void ensureClerkRuntimeConfig();
  }, []);

  return useSyncExternalStore(
    subscribeClerkRuntime,
    getClerkEnabledSnapshot,
    getClerkEnabledServerSnapshot
  );
}

export function useClerkRuntime() {
  useEffect(() => {
    void ensureClerkRuntimeConfig();
  }, []);

  return useSyncExternalStore(
    subscribeClerkRuntime,
    getClerkRuntimeSnapshot,
    getClerkRuntimeServerSnapshot
  );
}

/** True after the client has mounted (avoids hydration mismatch with Clerk UI). */
export function useClientMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
