"use client";

import { type ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useAdmin } from "@/hooks/use-admin";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert } from "lucide-react";

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isAdmin } = useAdmin();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Sign in to continue</h2>
          <p className="text-muted-foreground max-w-md">
            Admin access requires authentication and a whitelisted wallet.
          </p>
        </div>
        <AuthDialog />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground max-w-md">
            Your wallet is not authorized to access the admin panel.
            Connect a whitelisted wallet to continue.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
