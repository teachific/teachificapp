import { trpc } from "@/lib/trpc";

export type PlanTier = "free" | "starter" | "builder" | "pro" | "enterprise";

export interface PlanLimits {
  maxAdmins: number;
  maxMembers: number;
  maxCourses: number;
  maxCommunities: number;
  maxInstructors: number;
  maxStorageMb: number;
  maxMembershipTiers: number;
  transactionFeePercent: number;
  whiteLabel: boolean;
  emailMarketing: boolean;
  groupRegistrations: boolean;
  affiliateAccess: boolean;
  sso: boolean;
  customCss: boolean;
  customDomain: boolean;
  deepAnalytics: boolean;
  revenueShare: boolean;
}

export const PLAN_DISPLAY: Record<PlanTier, { label: string; color: string }> = {
  free: { label: "Free", color: "text-muted-foreground" },
  starter: { label: "Starter", color: "text-[#4ad9e0]" },
  builder: { label: "Builder", color: "text-[#15a4b7]" },
  pro: { label: "Pro", color: "text-[#0e8a96]" },
  enterprise: { label: "Enterprise", color: "text-[#0a6e78]" },
};

export function usePlanLimits() {
  const { data: subscription, isLoading } = trpc.billing.getSubscription.useQuery();

  const plan = (subscription?.plan ?? "free") as PlanTier;
  const limits = subscription?.limits as PlanLimits | undefined;

  const canCreateCourse = (currentCount: number) => {
    if (!limits) return true;
    if (limits.maxCourses === -1) return true;
    return currentCount < limits.maxCourses;
  };

  const canAddMember = (currentCount: number) => {
    if (!limits) return true;
    if (limits.maxMembers === -1) return true;
    return currentCount < limits.maxMembers;
  };

  const canAddAdmin = (currentCount: number) => {
    if (!limits) return true;
    if (limits.maxAdmins === -1) return true;
    return currentCount < limits.maxAdmins;
  };

  const hasFeature = (feature: keyof Pick<PlanLimits,
    "whiteLabel" | "emailMarketing" | "groupRegistrations" | "affiliateAccess" |
    "sso" | "customCss" | "customDomain" | "deepAnalytics" | "revenueShare"
  >) => {
    if (!limits) return false;
    return limits[feature] === true;
  };

  const isAtLimit = (resource: "courses" | "members" | "admins", currentCount: number) => {
    if (!limits) return false;
    const max = resource === "courses" ? limits.maxCourses
      : resource === "members" ? limits.maxMembers
      : limits.maxAdmins;
    if (max === -1) return false;
    return currentCount >= max;
  };

  return {
    plan,
    limits,
    isLoading,
    subscription,
    canCreateCourse,
    canAddMember,
    canAddAdmin,
    hasFeature,
    isAtLimit,
    isPaid: plan !== "free",
    isEnterprise: plan === "enterprise",
    isPro: plan === "pro" || plan === "enterprise",
    isBuilder: plan === "builder" || plan === "pro" || plan === "enterprise",
    isStarter: plan === "starter" || plan === "builder" || plan === "pro" || plan === "enterprise",
  };
}
