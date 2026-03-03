"use client";

import { useAppUser } from "@/hooks/useAppUser";
import { AuditDashboard } from "@/components/debug/AuditDashboard";
import { ShieldCheck, Zap, Layers, RefreshCw } from "lucide-react";

export default function AuditPage() {
    const { user } = useAppUser();

    if (process.env.NODE_ENV === "production" && user?.role !== "admin") {
        return <div>Access Denied</div>;
    }

    return (
        <div className="min-h-screen bg-void py-12 px-6">
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="space-y-4">
                    <h1 className="text-4xl font-display font-bold text-white tracking-tight">System Audit</h1>
                    <p className="text-text-secondary leading-relaxed max-w-2xl">
                        This dashboard provides a real-time overview of the platform's health, performance optimization status, and feature parity.
                    </p>
                </div>

                <AuditDashboard />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <AuditSection
                        title="Performance Optimization"
                        icon={<Zap className="w-5 h-5 text-solana" />}
                        items={[
                            "Static Rendering for Courses (Sanity ISR)",
                            "Stale-while-revalidate for API routes",
                            "Debounced Search in Course Catalog",
                            "Optimized SVG Assets & Recharts"
                        ]}
                    />
                    <AuditSection
                        title="State Management"
                        icon={<Layers className="w-5 h-5 text-blue-500" />}
                        items={[
                            "Zustand persist middleware for User State",
                            "Atomic updates for Enrollment Status",
                            "Optimistic UI transitions in Settings",
                            "Synchronized i18n locales across tabs"
                        ]}
                    />
                    <AuditSection
                        title="Security & Auth"
                        icon={<ShieldCheck className="w-5 h-5 text-green-500" />}
                        items={[
                            "Privy Wallet Integration",
                            "Server-side verification for mutations",
                            "Private Profile visibility guards",
                            "Environment variable separation"
                        ]}
                    />
                    <AuditSection
                        title="On-Chain Sync"
                        icon={<RefreshCw className="w-5 h-5 text-amber-500" />}
                        items={[
                            "Synchronous Meta-Sync on Login",
                            "Background Workers (Inngest) for TXs",
                            "PDA validation for course access",
                            "NFT Metadata URI consistency"
                        ]}
                    />
                </div>
            </div>
        </div>
    );
}

function AuditSection({ title, icon, items }: { title: string, icon: React.ReactNode, items: string[] }) {
    return (
        <div className="p-6 glass-panel rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center gap-3">
                {icon}
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
            </div>
            <ul className="space-y-2">
                {items.map(item => (
                    <li key={item} className="text-xs text-text-secondary flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-solana" />
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}
