"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { User, Shield, Palette, Eye, Wallet, Save, Check, Github, Globe, Sun, Moon, Monitor } from "lucide-react";
import { cn, shortenAddress } from "@/lib/utils";
import { LOCALE_LABELS, LOCALE_FLAGS, type Locale } from "@/lib/constants";
import { UserService } from "@/services";

const tabs = [
    { id: "profile", icon: User },
    { id: "account", icon: Shield },
    { id: "preferences", icon: Palette },
    { id: "privacy", icon: Eye },
] as const;

export default function SettingsPage() {
    const t = useTranslations("settings");
    const { theme, setTheme } = useTheme();
    const { connected, publicKey } = useWallet();
    const { setVisible } = useWalletModal();
    const [activeTab, setActiveTab] = useState<string>("profile");
    const [saved, setSaved] = useState(false);
    const user = UserService.getProfile();

    const [formData, setFormData] = useState({
        displayName: user.displayName,
        bio: user.bio,
        twitter: user.socialLinks.twitter || "",
        github: user.socialLinks.github || "",
        discord: user.socialLinks.discord || "",
        website: user.socialLinks.website || "",
        isPublic: user.isPublic,
        preferredLanguage: user.preferredLanguage,
    });

    const handleSave = () => {
        UserService.updateProfile({
            displayName: formData.displayName,
            bio: formData.bio,
            socialLinks: {
                twitter: formData.twitter,
                github: formData.github,
                discord: formData.discord,
                website: formData.website,
            },
            isPublic: formData.isPublic,
            preferredLanguage: formData.preferredLanguage,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const changeLocale = (locale: string) => {
        setFormData({ ...formData, preferredLanguage: locale });
        document.cookie = `locale=${locale};path=/;max-age=31536000`;
        window.location.reload();
    };

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

                <div className="flex flex-col sm:flex-row gap-6">
                    {/* Sidebar */}
                    <div className="sm:w-48 flex-shrink-0">
                        <nav className="flex sm:flex-col gap-1 p-1 sm:p-0 rounded-xl sm:rounded-none bg-card sm:bg-transparent border sm:border-0 border-border overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                        activeTab === tab.id
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                    )}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {t(tab.id)}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="flex-1 glass rounded-2xl p-6">
                        {activeTab === "profile" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                                <h2 className="text-lg font-semibold">{t("profile")}</h2>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5">{t("name")}</label>
                                    <input
                                        type="text"
                                        value={formData.displayName}
                                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5">{t("bio")}</label>
                                    <textarea
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-3">{t("socialLinks")}</label>
                                    <div className="space-y-3">
                                        {[
                                            { key: "twitter", icon: "𝕏", placeholder: "@username" },
                                            { key: "github", icon: "GH", placeholder: "username" },
                                            { key: "discord", icon: "DC", placeholder: "user#1234" },
                                            { key: "website", icon: "🌐", placeholder: "https://..." },
                                        ].map((social) => (
                                            <div key={social.key} className="flex items-center gap-2">
                                                <span className="w-8 h-8 rounded-lg bg-secondary/50 border border-border flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                                                    {social.icon}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={formData[social.key as keyof typeof formData] as string}
                                                    onChange={(e) => setFormData({ ...formData, [social.key]: e.target.value })}
                                                    placeholder={social.placeholder}
                                                    className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "account" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                                <h2 className="text-lg font-semibold">{t("account")}</h2>

                                <div>
                                    <label className="block text-sm font-medium mb-2">{t("connectedWallets")}</label>
                                    {connected && publicKey ? (
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border border-border">
                                            <Wallet className="w-5 h-5 text-purple-400" />
                                            <div className="flex-1">
                                                <div className="text-sm font-mono">{shortenAddress(publicKey.toBase58(), 8)}</div>
                                                <div className="text-xs text-emerald-400">Connected</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setVisible(true)}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all w-full"
                                        >
                                            <Wallet className="w-4 h-4" />
                                            {t("linkWallet")}
                                        </button>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">{t("linkedAccounts")}</label>
                                    <div className="space-y-2">
                                        <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all w-full">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                            {t("linkGoogle")}
                                        </button>
                                        <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all w-full">
                                            <Github className="w-5 h-5" />
                                            {t("linkGithub")}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "preferences" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                                <h2 className="text-lg font-semibold">{t("preferences")}</h2>

                                <div>
                                    <label className="block text-sm font-medium mb-2">{t("theme")}</label>
                                    <div className="flex gap-2">
                                        {[
                                            { value: "light", icon: Sun, label: "Light" },
                                            { value: "dark", icon: Moon, label: "Dark" },
                                            { value: "system", icon: Monitor, label: "System" },
                                        ].map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setTheme(opt.value)}
                                                className={cn(
                                                    "flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-all",
                                                    theme === opt.value
                                                        ? "border-primary bg-primary/10 text-primary"
                                                        : "border-border text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <opt.icon className="w-4 h-4" />
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">{t("language") || "Language"}</label>
                                    <div className="flex gap-2">
                                        {(Object.keys(LOCALE_LABELS) as Locale[]).map((locale) => (
                                            <button
                                                key={locale}
                                                onClick={() => changeLocale(locale)}
                                                className={cn(
                                                    "flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-all",
                                                    formData.preferredLanguage === locale
                                                        ? "border-primary bg-primary/10 text-primary"
                                                        : "border-border text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <span>{LOCALE_FLAGS[locale]}</span>
                                                {LOCALE_LABELS[locale]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "privacy" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                                <h2 className="text-lg font-semibold">{t("privacy")}</h2>

                                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-border">
                                    <div>
                                        <div className="text-sm font-medium">{t("profileVisibility")}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {formData.isPublic ? "Your profile is visible to everyone" : "Your profile is private"}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
                                        className={cn(
                                            "relative w-11 h-6 rounded-full transition-colors",
                                            formData.isPublic ? "bg-emerald-500" : "bg-secondary"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                                                formData.isPublic ? "translate-x-5.5" : "translate-x-0.5"
                                            )}
                                        />
                                    </button>
                                </div>

                                <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all">
                                    <Globe className="w-4 h-4" />
                                    {t("dataExport")}
                                </button>
                            </motion.div>
                        )}

                        {/* Save Button */}
                        <div className="mt-6 pt-4 border-t border-border flex items-center justify-end gap-3">
                            {saved && (
                                <motion.span
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-sm text-emerald-400 flex items-center gap-1"
                                >
                                    <Check className="w-4 h-4" /> Saved!
                                </motion.span>
                            )}
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                <Save className="w-4 h-4" />
                                {t("saveChanges")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
