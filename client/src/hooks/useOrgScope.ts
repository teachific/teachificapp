import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * useOrgScope — resolves the active org for the current user.
 *
 * Platform admins (site_owner / site_admin):
 *   - Fetches ALL orgs via platformAdmin.listOrgs
 *   - Auto-selects the org named "Teachific" (or the first one)
 *   - showOrgSelector is false (selector removed per design)
 *
 * Regular users (org_admin / user):
 *   - Fetches their own orgs via orgs.myOrgs
 *   - Auto-selects the first one
 *   - showOrgSelector is false
 */
export function useOrgScope() {
  const { user } = useAuth();
  const isPlatformAdmin = user?.role === "site_owner" || user?.role === "site_admin";
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  // Platform admins: use platformAdmin.listOrgs (already has adminProcedure gate)
  const { data: allOrgs } = trpc.platformAdmin.listOrgs.useQuery(undefined, {
    enabled: !!user && isPlatformAdmin,
  });

  // Regular users: use myOrgs
  const { data: myOrgs } = trpc.orgs.myOrgs.useQuery(undefined, {
    enabled: !!user && !isPlatformAdmin,
  });

  // Auto-select org for platform admins
  useEffect(() => {
    if (!isPlatformAdmin || !allOrgs || allOrgs.length === 0) return;
    if (selectedOrgId !== null) return; // already selected
    const teachific = allOrgs.find((o: any) => o.name?.toLowerCase() === "teachific");
    setSelectedOrgId(teachific ? teachific.id : allOrgs[0].id);
  }, [isPlatformAdmin, allOrgs, selectedOrgId]);

  // Compute the active orgId
  const orgId: number | null = isPlatformAdmin
    ? selectedOrgId
    : (myOrgs?.[0]?.id ?? null);

  return {
    showOrgSelector: false, // org selector removed — always auto-default
    orgId,
    orgs: isPlatformAdmin ? (allOrgs ?? []) : (myOrgs ?? []),
    setSelectedOrgId,
    ready: orgId !== null,
  };
}
