"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Users, BookOpen, Award, Activity, TrendingUp, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AdminPage() {
    const { publicKey } = useWallet();
    const t = useTranslations("admin");

    // Replace with real admin pubkeys
    // const isAdmin = publicKey?.toBase58() === "DUMMY_ADMIN_PUBKEY";
    const isAdmin = true;

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="font-heading text-2xl font-bold">{t("access_denied")}</h1>
                    <p className="text-[hsl(var(--muted-foreground))]">
                        {t("access_denied_desc")}
                    </p>
                </div>
            </div>
        );
    }

    const METRICS = [
        { label: t("total_users"), value: "1,245", change: "+12%", icon: Users, color: "text-blue-400" },
        { label: t("active_courses"), value: "8", change: "+0%", icon: BookOpen, color: "text-purple-400" },
        { label: t("credentials_issued"), value: "3,890", change: "+24%", icon: Award, color: "text-yellow-400" },
        { label: t("daily_active"), value: "450", change: "+5%", icon: Activity, color: "text-green-400" },
    ];

    return (
        <div className="min-h-screen">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="font-heading text-3xl font-bold mb-2">{t("title")}</h1>
                        <p className="text-[hsl(var(--muted-foreground))]">{t("subtitle")}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] bg-[hsl(var(--card))] px-4 py-2 rounded-lg border border-[hsl(var(--border))]">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        {t("system_status")}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {METRICS.map((m) => (
                        <div key={m.label} className="glass rounded-xl p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-10 h-10 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center ${m.color}`}>
                                    <m.icon className="w-5 h-5" />
                                </div>
                                <span className="flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                                    <TrendingUp className="w-3 h-3" /> {m.change}
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold font-heading mb-1">{m.value}</h3>
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">{m.label}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass rounded-xl p-6">
                        <h2 className="font-heading text-xl font-bold mb-4">{t("recent_activity")}</h2>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.2)] flex items-center justify-center text-xs font-bold text-[hsl(var(--primary))]">
                                        U{i}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm">User <strong>solana_dev_{i}</strong> completed <span className="text-[hsl(var(--primary))]">Anchor Basics</span></p>
                                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{i * 15} mins ago</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass rounded-xl p-6">
                        <h2 className="font-heading text-xl font-bold mb-4">{t("system_alerts")}</h2>
                        <div className="space-y-3">
                            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-yellow-500">RPC Node Latency</p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Primary RPC node is experiencing higher than normal latency (250ms). Consider failing over to secondary.</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex gap-3">
                                <Activity className="w-5 h-5 text-green-500 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-green-500">Database Backup Successful</p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Automated backup completed at 03:00 UTC. 2.4GB stored securely.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
