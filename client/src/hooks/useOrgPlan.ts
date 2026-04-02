import { trpc } from "@/lib/trpc";
import { getLimits, meetsRequirement, PLAN_LABELS, type PlanTier, type TierLimits } from "../../../shared/tierLimits";

/**
 * Returns the current org's subscription plan and limits.
 * Falls back to "free" if no subscription exists.
 */
export function useOrgPlan(orgId: number | null | undefined) {
  const { data: sub, isLoading } = trpc.lms.subscription.get.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  const plan = (sub?.plan ?? "free") as PlanTier;
  const limits: TierLimits = getLimits(plan);
  const planLabel = PLAN_LABELS[plan];

  const can = (feature: keyof TierLimits): boolean => {
    const val = limits[feature];
    if (typeof val === "boolean") return val;
    if (typeof val === "number") return val > 0;
    if (val === null) return true; // unlimited
    return false;
  };

  const meets = (required: PlanTier): boolean => meetsRequirement(plan, required);

  return { plan, planLabel, limits, can, meets, isLoading, sub };
}
