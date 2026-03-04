"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/auth-context";

export default function ProfileRedirect() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            const username = user?.username || user?.name?.toLowerCase().replace(/\s+/g, "") || "me";
            router.replace(`/profile/${username}`);
        }
    }, [isLoading, user, router]);

    return (
        <div className="min-h-screen bg-[#020408] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
        </div>
    );
}
