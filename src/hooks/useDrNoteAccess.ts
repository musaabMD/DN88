"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchCurrentUser } from "@/lib/api";
import { resolveAccess, type DrNoteAccess } from "@/lib/access";
import { getClerkToken, isClerkSignedIn } from "@/lib/clerk-token";
import { useClerkEnabled } from "@/hooks/useClerkEnabled";

const GUEST_ACCESS = resolveAccess({ isSignedIn: false, loading: false });

export function useDrNoteAccess(): DrNoteAccess {
  const clerkEnabled = useClerkEnabled();
  const [remoteAccess, setRemoteAccess] = useState<DrNoteAccess | null>(null);

  useEffect(() => {
    if (!clerkEnabled || !isClerkSignedIn()) return;

    let cancelled = false;
    (async () => {
      try {
        const token = await getClerkToken();
        const user = token ? await fetchCurrentUser(token) : null;
        if (!cancelled) {
          setRemoteAccess(
            resolveAccess({
              isSignedIn: true,
              plan: user?.medgenius?.plan ?? user?.plan,
              role: user?.role,
              loading: false,
            })
          );
        }
      } catch {
        if (!cancelled) {
          setRemoteAccess(resolveAccess({ isSignedIn: true, loading: false }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clerkEnabled]);

  return useMemo(() => {
    if (!clerkEnabled) return GUEST_ACCESS;
    if (!isClerkSignedIn()) return GUEST_ACCESS;
    if (!remoteAccess) {
      return resolveAccess({ isSignedIn: true, loading: true });
    }
    return remoteAccess;
  }, [clerkEnabled, remoteAccess]);
}
