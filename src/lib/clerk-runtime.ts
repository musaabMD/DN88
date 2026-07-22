"use client";

import { getApiBaseUrl } from "@/lib/api";
import {
  isClerkHost,
  isPublishableKeyConfigured,
  CLERK_SIGN_IN_URL,
  CLERK_SIGN_UP_URL,
} from "@/lib/clerk";

type RuntimeConfig = {
  publishableKey: string | null;
};

type RuntimeSnapshot = {
  checked: boolean;
  publishableKey: string | null;
};

const buildPublishableKey = isPublishableKeyConfigured(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
)
  ? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.trim()
  : null;

let runtimeConfig: RuntimeConfig | null = null;
let runtimeChecked = Boolean(buildPublishableKey);
let runtimePromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) listener();
}

export function subscribeClerkRuntime(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getClerkRuntimeSnapshot(): RuntimeSnapshot {
  const runtimeKey = runtimeConfig?.publishableKey;
  const publishableKey = buildPublishableKey ?? runtimeKey ?? null;
  return {
    checked: runtimeChecked,
    publishableKey: isPublishableKeyConfigured(publishableKey) ? publishableKey : null,
  };
}

export function getClerkRuntimeServerSnapshot(): RuntimeSnapshot {
  return {
    checked: Boolean(buildPublishableKey),
    publishableKey: buildPublishableKey,
  };
}

export function isClerkRuntimeActiveForHost(hostname: string): boolean {
  return isClerkHost(hostname) && Boolean(getClerkRuntimeSnapshot().publishableKey);
}

export function ensureClerkRuntimeConfig(): Promise<void> {
  if (buildPublishableKey || runtimePromise) {
    return runtimePromise ?? Promise.resolve();
  }

  if (typeof window === "undefined" || !isClerkHost(window.location.hostname)) {
    runtimeChecked = true;
    return Promise.resolve();
  }

  runtimePromise = fetch(`${getApiBaseUrl()}/api/public-config`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  })
    .then(async (response) => {
      if (!response.ok) return;
      const payload = (await response.json()) as {
        clerk?: { publishableKey?: string | null };
      };
      const publishableKey = payload.clerk?.publishableKey?.trim() ?? null;
      runtimeConfig = {
        publishableKey: isPublishableKeyConfigured(publishableKey) ? publishableKey : null,
      };
    })
    .catch(() => {
      runtimeConfig = { publishableKey: null };
    })
    .finally(() => {
      runtimeChecked = true;
      runtimePromise = null;
      notifyListeners();
    });

  return runtimePromise;
}

export function getFallbackAuthHref(kind: "sign-in" | "sign-up") {
  return kind === "sign-in" ? CLERK_SIGN_IN_URL : CLERK_SIGN_UP_URL;
}
