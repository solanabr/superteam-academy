"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { OnboardingDialog } from "@/components/onboarding-dialog";

/**
 * Protected route group layout.
 * Redirects to landing page if user is not authenticated (NextAuth session OR wallet).
 * Shows onboarding dialog for first-time users.
 */
export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace("/");
        }
    }, [isAuthenticated, isLoading, router]);

    // While loading or redirecting
    if (isLoading || !isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-solana-purple" />
            </div>
        );
    }

    return (
        <>
            <OnboardingDialog />
            {children}
        </>
    );
}
