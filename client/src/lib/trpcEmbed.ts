/**
 * Cookie-free tRPC client for use inside embedded iframes.
 * Uses credentials: "omit" so no session cookies are sent.
 * All auth is handled via embed tokens passed explicitly in request bodies.
 */
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers";
import { httpBatchLink } from "@trpc/client";
import { QueryClient } from "@tanstack/react-query";
import superjson from "superjson";

export const trpcEmbed = createTRPCReact<AppRouter>();

export const embedQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

export const embedTrpcClient = trpcEmbed.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "omit", // No cookies — works in third-party iframe contexts
        });
      },
    }),
  ],
});
