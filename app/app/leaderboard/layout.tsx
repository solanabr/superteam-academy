"use client";

import { Navbar } from "@/components/landing/Navbar";

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-zinc-900">
            <Navbar />
            {children}
        </div>
    );
}
