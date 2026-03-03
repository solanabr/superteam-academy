"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { User, Mail, Github, LogOut, Shield, Bell, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
    const { publicKey, disconnect } = useWallet();
    const t = useTranslations("settings");

    const handleSave = () => {
        toast.success(t("save_success"));
    };

    return (
        <div className="min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary)/0.2)] flex items-center justify-center">
                        <SettingsIcon className="w-5 h-5 text-[hsl(var(--primary))]" />
                    </div>
                    <div>
                        <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
                        <p className="text-[hsl(var(--muted-foreground))]">{t("subtitle")}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Settings Navigation */}
                    <div className="space-y-2">
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[hsl(var(--primary))] text-white font-medium transition-colors">
                            <User className="w-4 h-4" /> {t("tab_profile")}
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] font-medium transition-colors">
                            <Shield className="w-4 h-4" /> {t("tab_account")}
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] font-medium transition-colors">
                            <Bell className="w-4 h-4" /> {t("tab_notifications")}
                        </button>
                    </div>

                    {/* Settings Content */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Public Profile Section */}
                        <div className="glass rounded-2xl p-6">
                            <h2 className="font-heading text-lg font-semibold mb-4">{t("public_profile")}</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">
                                        {t("username")}
                                    </label>
                                    <input 
                                        type="text" 
                                        defaultValue="solana_builder"
                                        className="w-full bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[hsl(var(--primary)/0.5)] transition-colors"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">
                                        {t("bio")}
                                    </label>
                                    <textarea 
                                        defaultValue="Learning Solana development with Superteam Brazil 🇧🇷"
                                        rows={3}
                                        className="w-full bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[hsl(var(--primary)/0.5)] transition-colors resize-none"
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-6 flex justify-end">
                                <button 
                                    onClick={handleSave}
                                    className="px-6 py-2 bg-[hsl(var(--primary))] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                                >
                                    {t("save_changes")}
                                </button>
                            </div>
                        </div>

                        {/* Connected Accounts Section */}
                        <div className="glass rounded-2xl p-6">
                            <h2 className="font-heading text-lg font-semibold mb-4">{t("connected_accounts")}</h2>
                            
                            <div className="space-y-3">
                                {/* Wallet */}
                                <div className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                            <div className="w-5 h-5 bg-gradient-to-tr from-purple-500 to-green-400 rounded-full" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{t("wallet")}</p>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono mt-0.5">
                                                {publicKey ? `${publicKey.toBase58().slice(0, 8)}...${publicKey.toBase58().slice(-8)}` : "Not connected"}
                                            </p>
                                        </div>
                                    </div>
                                    {publicKey ? (
                                        <button 
                                            onClick={disconnect}
                                            className="p-2 text-[hsl(var(--muted-foreground))] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                            title="Disconnect"
                                        >
                                            <LogOut className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[hsl(var(--primary))] text-white">
                                            {t("connect")}
                                        </button>
                                    )}
                                </div>

                                {/* GitHub */}
                                <div className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
                                            <Github className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">GitHub</p>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                                                {t("github_desc")}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[hsl(var(--muted-foreground)/0.2)] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted-foreground)/0.3)] transition-colors">
                                        {t("connect")}
                                    </button>
                                </div>

                                {/* Email */}
                                <div className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">Email</p>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                                                {t("email_desc")}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[hsl(var(--muted-foreground)/0.2)] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted-foreground)/0.3)] transition-colors">
                                        {t("verify")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}