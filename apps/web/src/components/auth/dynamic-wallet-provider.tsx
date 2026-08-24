"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DynamicProvider } from "@dynamic-labs-sdk/react-hooks";
import { getDynamicClient } from "@/lib/dynamic/client";
import { DynamicAuthHandler } from "@/components/auth/dynamic-auth-handler";
import { DynamicSessionKeepalive } from "@/components/auth/dynamic-session-keepalive";

/**
 * Dynamic embedded wallets for the whole app.
 *
 * Every learner can get a real Solana wallet from an email sign-in, so there is
 * no longer a class of learner who can hold an account but not enrol — which is
 * what the per-course offline workaround existed to paper over.
 *
 * `QueryClientProvider` is not optional decoration: every hook in
 * `@dynamic-labs-sdk/react-hooks` is built on TanStack Query, and one used
 * without it throws "No QueryClient set". It must sit OUTSIDE `DynamicProvider`.
 *
 * When the environment id is unset this renders its children untouched — no
 * provider, no SDK initialisation, no network call. That keeps the gate's
 * promise that an unconfigured build is simply a build without embedded
 * wallets, never a broken one, and leaves SIWS with an external wallet as the
 * guaranteed way in.
 */
export function DynamicWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const client = getDynamicClient();

  // One QueryClient for the app's lifetime. Created through `useState` rather
  // than at module scope so a server render cannot share cache entries between
  // two learners' requests.
  const [queryClient] = useState(() => new QueryClient());

  if (!client) return <>{children}</>;

  return (
    <QueryClientProvider client={queryClient}>
      <DynamicProvider client={client}>
        {/* Mounted INSIDE the provider, never beside it: the handler calls
            hooks that throw `MissingProviderError` outside one. As a sibling
            it would crash every page, and only on hydration, so the build
            would still look healthy. */}
        <DynamicAuthHandler />
        {/* Uses no hooks from the SDK, so it could sit anywhere under the
            client — kept here so everything Dynamic-lifecycle is in one place. */}
        <DynamicSessionKeepalive />
        {children}
      </DynamicProvider>
    </QueryClientProvider>
  );
}
