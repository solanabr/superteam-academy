"use client";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { SyncUserOnLogin } from "@/components/auth/SyncUserOnLogin";
import { ReactNode } from "react";

/**
 * This layout wraps all routes that require authentication logic (Login + Platform).
 * By moving the AuthProvider here, we ensure the heavy Solana/Privy SDKs 
 * are NOT loaded on the landing page.
 */
export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <SyncUserOnLogin />
            {children}
        </AuthProvider>
    );
}
