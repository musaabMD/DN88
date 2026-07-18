export type DrNotePlan = "free" | "starter" | "student" | "pro";

export type DrNoteAccess = {
  isSignedIn: boolean;
  plan: DrNotePlan;
  isAdmin: boolean;
  canUseQbank: boolean;
  canUseLibrary: boolean;
  canUploadDocuments: boolean;
  loading: boolean;
};

const PAID_PLANS = new Set<DrNotePlan>(["starter", "student", "pro"]);

export function normalizePlan(value: string | undefined | null): DrNotePlan {
  if (value === "pro" || value === "student" || value === "starter") return value;
  return "free";
}

export function resolveAccess(params: {
  isSignedIn: boolean;
  plan?: string | null;
  role?: string | null;
  loading?: boolean;
}): DrNoteAccess {
  const plan = normalizePlan(params.plan ?? "free");
  const isAdmin = params.role === "admin";
  const isPaid = PAID_PLANS.has(plan);

  return {
    isSignedIn: params.isSignedIn,
    plan,
    isAdmin,
    canUseQbank: params.isSignedIn && (isAdmin || isPaid),
    canUseLibrary: params.isSignedIn,
    canUploadDocuments: params.isSignedIn,
    loading: params.loading ?? false,
  };
}
