"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SectionReveal } from "@/components/motion/section-reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    User,
    Link2,
    Sliders,
    Shield,
    Wallet,
    Github,
    CheckCircle2,
    Circle,
} from "lucide-react";
import { mockSettings } from "@/lib/data";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Tab = "profile" | "accounts" | "preferences" | "privacy";

const tabs: { key: Tab; icon: React.ElementType }[] = [
    { key: "profile", icon: User },
    { key: "accounts", icon: Link2 },
    { key: "preferences", icon: Sliders },
    { key: "privacy", icon: Shield },
];

export default function SettingsPage() {
    const t = useTranslations("Settings");
    const [activeTab, setActiveTab] = useState<Tab>("profile");
    const [settings, setSettings] = useState(mockSettings);

    // Theme & Locale
    const theme = useTheme();
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const handleLanguageChange = (newLocale: string) => {
        router.replace(pathname, { locale: newLocale });
    };

    return (
        <div className="min-h-screen">
            <Header />
            <main className="pt-28 pb-16">
                <div className="content-container">
                    <SectionReveal>
                        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{t("title")}</h1>
                    </SectionReveal>

                    <div className="mt-8 grid gap-8 lg:grid-cols-4">
                        {/* Tab Navigation */}
                        <SectionReveal delay={0.05}>
                            <nav className="flex gap-1 lg:flex-col">
                                {tabs.map(({ key, icon: Icon }) => (
                                    <button
                                        key={key}
                                        onClick={() => setActiveTab(key)}
                                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === key
                                            ? "bg-accent text-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                            }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span className="hidden sm:inline">{t(key)}</span>
                                    </button>
                                ))}
                            </nav>
                        </SectionReveal>

                        {/* Content */}
                        <div className="lg:col-span-3">
                            <SectionReveal delay={0.1}>
                                <div className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-sm">
                                    {/* Profile */}
                                    {activeTab === "profile" && (
                                        <div className="space-y-6">
                                            <div>
                                                <h2 className="text-lg font-semibold">{t("profile")}</h2>
                                                <p className="text-sm text-muted-foreground">Manage your public profile information.</p>
                                            </div>
                                            <Separator />
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label>{t("displayName")}</Label>
                                                    <Input
                                                        value={settings.profile.displayName}
                                                        onChange={(e) => setSettings((s) => ({ ...s, profile: { ...s.profile, displayName: e.target.value } }))}
                                                        className="max-w-sm"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>{t("bio")}</Label>
                                                    <textarea
                                                        value={settings.profile.bio}
                                                        onChange={(e) => setSettings((s) => ({ ...s, profile: { ...s.profile, bio: e.target.value } }))}
                                                        rows={3}
                                                        className="flex w-full max-w-lg rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                    />
                                                </div>
                                            </div>
                                            <Button className="rounded-full bg-gradient-to-r from-solana-purple to-solana-green text-white hover:brightness-110">
                                                {t("save")}
                                            </Button>
                                        </div>
                                    )}

                                    {/* Linked Accounts */}
                                    {activeTab === "accounts" && (
                                        <div className="space-y-6">
                                            <div>
                                                <h2 className="text-lg font-semibold">{t("accounts")}</h2>
                                                <p className="text-sm text-muted-foreground">Connect external accounts to your profile.</p>
                                            </div>
                                            <Separator />
                                            <div className="space-y-4">
                                                {[
                                                    { key: "wallet", icon: Wallet, connected: settings.linkedAccounts.wallet, value: settings.linkedAccounts.wallet },
                                                    { key: "github", icon: Github, connected: settings.linkedAccounts.github, value: settings.linkedAccounts.github },
                                                    { key: "google", icon: Circle, connected: settings.linkedAccounts.google, value: settings.linkedAccounts.google },
                                                ].map(({ key, icon: Icon, connected, value }) => (
                                                    <div key={key} className="flex items-center justify-between rounded-xl border border-border/40 bg-card/50 p-4">
                                                        <div className="flex items-center gap-3">
                                                            <Icon className="h-5 w-5 text-muted-foreground" />
                                                            <div>
                                                                <p className="text-sm font-medium">{t(key as "wallet")}</p>
                                                                {connected && <p className="text-xs text-muted-foreground font-mono">{value}</p>}
                                                            </div>
                                                        </div>
                                                        {connected ? (
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle2 className="h-4 w-4 text-solana-green" />
                                                                <span className="text-xs text-solana-green font-medium">{t("connected")}</span>
                                                                <Button size="sm" variant="ghost" className="text-xs text-muted-foreground">{t("disconnect")}</Button>
                                                            </div>
                                                        ) : (
                                                            <Button size="sm" variant="outline" className="rounded-full text-xs">{t("connect")}</Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Preferences */}
                                    {activeTab === "preferences" && (
                                        <div className="space-y-6">
                                            <div>
                                                <h2 className="text-lg font-semibold">{t("preferences")}</h2>
                                                <p className="text-sm text-muted-foreground">Customize your learning experience.</p>
                                            </div>
                                            <Separator />

                                            {/* App Settings */}
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-semibold">{t("appSettings", { defaultValue: "App Settings" })}</h3>
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm">{t("language", { defaultValue: "Language" })}</Label>
                                                    <Select value={locale} onValueChange={handleLanguageChange}>
                                                        <SelectTrigger className="w-[180px]">
                                                            <SelectValue placeholder="Select Language" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="en">English</SelectItem>
                                                            <SelectItem value="pt-BR">Português (BR)</SelectItem>
                                                            <SelectItem value="es">Español</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm">{t("theme", { defaultValue: "Theme" })}</Label>
                                                    <Select value={theme.theme || "system"} onValueChange={theme.setTheme}>
                                                        <SelectTrigger className="w-[180px]">
                                                            <SelectValue placeholder="Select Theme" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="dark">Dark</SelectItem>
                                                            <SelectItem value="light">Light</SelectItem>
                                                            <SelectItem value="system">System</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <Separator />

                                            {/* Notifications */}
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-semibold">{t("notifications", { defaultValue: "Notifications" })}</h3>
                                                <div className="space-y-5">
                                                    {[
                                                        { key: "emailNotifications", checked: settings.preferences.emailNotifications },
                                                        { key: "achievementNotifications", checked: settings.preferences.achievementNotifications },
                                                        { key: "weeklyDigest", checked: settings.preferences.weeklyDigest },
                                                    ].map(({ key, checked }) => (
                                                        <div key={key} className="flex items-center justify-between">
                                                            <Label className="text-sm">{t(key as "emailNotifications")}</Label>
                                                            <Switch
                                                                checked={checked}
                                                                onCheckedChange={(val) =>
                                                                    setSettings((s) => ({
                                                                        ...s,
                                                                        preferences: { ...s.preferences, [key]: val },
                                                                    }))
                                                                }
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <Button className="rounded-full bg-gradient-to-r from-solana-purple to-solana-green text-white hover:brightness-110">
                                                {t("save")}
                                            </Button>
                                        </div>
                                    )}

                                    {/* Privacy */}
                                    {activeTab === "privacy" && (
                                        <div className="space-y-6">
                                            <div>
                                                <h2 className="text-lg font-semibold">{t("privacy")}</h2>
                                                <p className="text-sm text-muted-foreground">Control what others can see about you.</p>
                                            </div>
                                            <Separator />
                                            <div className="space-y-5">
                                                {[
                                                    { key: "showProfile", checked: settings.privacy.showProfile },
                                                    { key: "showProgress", checked: settings.privacy.showProgress },
                                                    { key: "showAchievements", checked: settings.privacy.showAchievements },
                                                    { key: "showOnLeaderboard", checked: settings.privacy.showOnLeaderboard },
                                                ].map(({ key, checked }) => (
                                                    <div key={key} className="flex items-center justify-between">
                                                        <Label className="text-sm">{t(key as "showProfile")}</Label>
                                                        <Switch
                                                            checked={checked}
                                                            onCheckedChange={(val) =>
                                                                setSettings((s) => ({
                                                                    ...s,
                                                                    privacy: { ...s.privacy, [key]: val },
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <Button className="rounded-full bg-gradient-to-r from-solana-purple to-solana-green text-white hover:brightness-110">
                                                {t("save")}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </SectionReveal>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
