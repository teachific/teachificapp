/**
 * useOrgScope — platform-wide org scoping hook
 *
 * - Platform owners (site_owner) and platform admins (admin):
 *     showOrgSelector = true, selectedOrgId starts null (must pick)
 * - Org admins (org_admin) and regular users:
 *     showOrgSelector = false, orgId is auto-resolved from their first membership
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export function useOrgScope() {
  const { user } = useAuth();
  const isPlatformAdmin =
    user?.role === "site_owner" || user?.role === "site_admin";

  // For platform admins, allow manual selection
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  // Always fetch orgs list (used both for selector and auto-resolve)
  const { data: orgs } = trpc.orgs.list.useQuery(undefined, {
    enabled: !!user,
  });

  // For org admins, auto-resolve from their memberships
  const { data: myOrgs } = trpc.orgs.myOrgs.useQuery(undefined, {
    enabled: !!user && !isPlatformAdmin,
  });

  let orgId: number | null;
  if (isPlatformAdmin) {
    orgId = selectedOrgId;
  } else {
    orgId = myOrgs?.[0]?.id ?? null;
  }

  return {
    /** Whether to render an org selector in the UI */
    showOrgSelector: isPlatformAdmin,
    /** The currently active org ID (null = not yet selected for platform admins) */
    orgId,
    /** All orgs available for the selector (platform admins only) */
    orgs: isPlatformAdmin ? orgs ?? [] : [],
    /** Setter for the selector (platform admins only) */
    setSelectedOrgId,
    /** Whether data queries should be enabled */
    ready: orgId !== null,
  };
}
