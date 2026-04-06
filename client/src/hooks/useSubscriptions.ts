/**
 * useSubscriptions
 * Returns all active product subscriptions for the current user in a single query.
 * Used to drive cross-product navigation — only show links to products the user has access to.
 */
import { trpc } from "@/lib/trpc";

export type ProductSubscriptions = {
  lms: { plan: string; isActive: boolean };
  studio: { tier: string; isActive: boolean; isInTrial: boolean };
  creator: { tier: string; isActive: boolean; isInTrial: boolean };
  quizCreator: { tier: string; isActive: boolean; isInTrial: boolean };
};

export function useSubscriptions() {
  const { data, isLoading } = trpc.billing.getAllSubscriptions.useQuery(undefined, {
    staleTime: 60_000, // cache for 1 minute — subscription status rarely changes mid-session
    retry: 1,
  });

  return {
    subs: data ?? null,
    isLoading,
    hasLms: data?.lms.isActive ?? false,
    hasStudio: data?.studio.isActive ?? false,
    hasCreator: data?.creator.isActive ?? false,
    hasQuizCreator: data?.quizCreator.isActive ?? false,
    /** True if the user has at least one product beyond LMS */
    hasAnyStandaloneApp: (data?.studio.isActive || data?.creator.isActive || data?.quizCreator.isActive) ?? false,
  };
}
