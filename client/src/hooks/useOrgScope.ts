import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export function useOrgScope() {
  const { user } = useAuth();
  const isPlatformAdmin = user?.role === "site_owner" || user?.role === "site_admin";
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  const { data: orgs } = trpc.orgs.list.useQuery(undefined, {
    enabled: !!user && isPlatformAdmin,
  });

  const { data: myOrgs } = trpc.orgs.myOrgs.useQuery(undefined, {
    enabled: !!user && !isPlatformAdmin,
  });

  useEffect(() => {
    if (isPlatformAdmin && orgs && orgs.length > 0 && selectedOrgId === null) {
      const teachific = orgs.find((o: any) => o.name?.toLowerCase() === "teachific");
      setSelectedOrgId(teachific ? teachific.id : orgs[0].id);
    }
  }, [isPlatformAdmin, orgs, selectedOrgId]);

  const orgId: number | null = isPlatformAdmin ? selectedOrgId : (myOrgs?.[0]?.id ?? null);

  return {
    showOrgSelector: isPlatformAdmin,
    orgId,
    orgs: isPlatformAdmin ? (orgs ?? []) : [],
    setSelectedOrgId,
    ready: orgId !== null,
  };
}
