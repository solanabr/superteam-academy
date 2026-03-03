"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useI18n } from "../../i18n/I18nProvider";
import { SUPPORTED_LOCALES, type Locale } from "../../i18n/locales";
import { useState } from "react";
import { motion } from "framer-motion";
import {
    User,
    Wallet,
    Github,
    Mail,
    Globe,
    Eye,
    Lock,
    Save,
    Link2,
    CheckCircle2,
    Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
    const { publicKey } = useWallet();
    const { t, locale, setLocale } = useI18n();
    const [name, setName] = useState("Solana Developer");
    const [bio, setBio] = useState("Building the future of decentralized learning.");
    const [visibility, setVisibility] = useState<"public" | "private">("public");
    const [saved, setSaved] = useState(false);

    if (!publicKey) {
        return (
            <main className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                        <Lock className="h-7 w-7 text-primary" />
                    </div>
                    <h1 className="text-xl font-bold">Connect Your Wallet</h1>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                        Connect your Solana wallet to manage settings.
                    </p>
                </motion.div>
            </main>
        );
    }

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <main className="mx-auto max-w-2xl px-4 py-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Manage your profile, preferences, and connected accounts.
                </p>
            </motion.div>

            {/* Profile section */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-8"
            >
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-primary" />
                            Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                Display Name
                            </label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your display name"
                                className="bg-black/5 text-foreground dark:bg-black/40 border-border font-space"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                Bio
                            </label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={3}
                                className="flex w-full rounded-md border border-border bg-black/5 dark:bg-black/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors resize-none font-space"
                            />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Connected Accounts */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-6"
            >
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Link2 className="h-4 w-4 text-primary" />
                            Connected Accounts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0">
                        {/* Wallet */}
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                    <Wallet className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Solana Wallet</p>
                                    <p className="text-xs text-primary font-mono">
                                        {publicKey.toBase58().slice(0, 8)}...
                                        {publicKey.toBase58().slice(-4)}
                                    </p>
                                </div>
                            </div>
                            <Badge variant="default" className="text-[10px]">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Connected
                            </Badge>
                        </div>

                        {/* Google */}
                        <div className="flex items-center justify-between border-t border-border/50 py-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Google Account</p>
                                    <p className="text-xs text-muted-foreground">
                                        Link for email login
                                    </p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="text-xs h-8">
                                Link
                            </Button>
                        </div>

                        {/* GitHub */}
                        <div className="flex items-center justify-between border-t border-border/50 py-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50">
                                    <Github className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">GitHub</p>
                                    <p className="text-xs text-muted-foreground">
                                        Link for developer identity
                                    </p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="text-xs h-8">
                                Link
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Preferences */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6"
            >
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Globe className="h-4 w-4 text-primary" />
                            Preferences
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                {t("nav.language")}
                            </label>
                            <select
                                value={locale}
                                onChange={(e) => setLocale(e.target.value as Locale)}
                                className="flex h-10 w-full rounded-md border border-border bg-black/5 dark:bg-black/40 px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors font-space"
                            >
                                {SUPPORTED_LOCALES.map((l) => (
                                    <option key={l.code} value={l.code}>
                                        {l.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Privacy */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-6"
            >
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Shield className="h-4 w-4 text-primary" />
                            Privacy
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50">
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Profile Visibility</p>
                                    <p className="text-xs text-muted-foreground">
                                        Control who can see your profile
                                    </p>
                                </div>
                            </div>
                            <select
                                value={visibility}
                                onChange={(e) =>
                                    setVisibility(e.target.value as "public" | "private")
                                }
                                className="rounded-md border border-border bg-black/5 dark:bg-black/40 text-foreground px-3 py-1.5 text-sm transition-colors focus:border-primary/50 focus:outline-none font-space"
                            >
                                <option value="public">Public</option>
                                <option value="private">Private</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Save */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8"
            >
                <Button onClick={handleSave} className="w-full gap-2" size="lg">
                    {saved ? (
                        <>
                            <CheckCircle2 className="h-4 w-4" />
                            Saved!
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </motion.div>
        </main>
    );
}
