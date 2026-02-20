"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireWallet?: boolean;
}

export function ProtectedRoute({
  children,
  fallback,
  requireWallet = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, walletLinked } = useAuth();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      fallback ?? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Sign in to continue</h2>
            <p className="text-muted-foreground max-w-md">
              Create an account or sign in to access your dashboard, track
              progress, and earn credentials.
            </p>
          </div>
          <AuthDialog />
        </div>
      )
    );
  }

  if (requireWallet && !walletLinked) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Wallet required</h2>
          <p className="text-muted-foreground max-w-md">
            Connect and link a Solana wallet to enroll in courses and receive
            on-chain credentials.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
