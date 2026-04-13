import { trpc } from "@/lib/trpc";
import { getLimits, meetsRequirement, PLAN_LABELS, type PlanTier, type TierLimits } from "../../../shared/tierLimits";
import { useAuth } from "@/_core/hooks/useAuth";

/** Unlimited limits — every feature enabled, every numeric cap is null (unlimited) */
const UNLIMITED_LIMITS: TierLimits = {
  maxCourses: null,
  maxMembers: null,
  maxStorageGb: null,
  maxInstructors: null,
  maxBundles: null,
  maxCommunities: null,
  aiGeneration: true,
  dripScheduling: true,
  certificates: true,
  courseBundles: true,
  memberships: true,
  advancedAnalytics: true,
  liveSessions: true,
  hiddenPrivateCourses: true,
  customCode: true,
  zapierIntegrations: true,
  customDomain: true,
  whiteLabel: true,
  upsellFunnels: true,
  coupons: true,
  affiliates: true,
  prioritySupport: true,
};

/**
 * Returns the current org's subscription plan and limits.
 * Platform admins (site_owner, site_admin) and org super admins always get unlimited access
 * regardless of the org's actual subscription plan.
 * Falls back to "free" if no subscription exists for regular users.
 */
export function useOrgPlan(orgId: number | null | undefined) {
  const { user } = useAuth();
  const isPlatformAdmin = user?.role === "site_owner" || user?.role === "site_admin" || user?.role === "org_super_admin";

  const { data: sub, isLoading } = trpc.lms.subscription.get.useQuery(
    { orgId: orgId! },
    // Skip the subscription query entirely for platform admins and org super admins — they always have full access
    { enabled: !!orgId && !isPlatformAdmin }
  );

  // Platform admins and org super admins bypass every plan gate — treat as unlimited enterprise
  if (isPlatformAdmin) {
    return {
      plan: "enterprise" as PlanTier,
      planLabel: "Enterprise",
      limits: UNLIMITED_LIMITS,
      can: (_feature: keyof TierLimits) => true,
      meets: (_required: PlanTier) => true,
      isLoading: false,
      sub: null,
      isPlatformAdmin: true,
    };
  }

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

  return { plan, planLabel, limits, can, meets, isLoading, sub, isPlatformAdmin: false };
}
