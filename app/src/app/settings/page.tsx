"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { toast } from "sonner";
import { Wallet, User, Github, Chrome, Shield, Save } from "lucide-react";

export default function SettingsPage() {
    const { publicKey, connected } = useWallet();
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        setSaving(true);
        await new Promise((r) => setTimeout(r, 800));
        setSaving(false);
        toast.success("Profile updated!");
    }

    if (!connected) {
        return (
            <div className="min-h-screen">
                <Header />
                <div className="flex flex-col items-center justify-center mt-32 gap-4 text-center px-4">
                    <Shield className="w-12 h-12 text-[hsl(var(--primary))]" />
                    <h2 className="font-heading text-2xl font-bold">Connect Wallet</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Connect your wallet to access settings.</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Header />

            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
                <h1 className="font-heading text-3xl font-bold mb-8">Settings</h1>

                {/* Profile section */}
                <section className="glass rounded-2xl p-6 mb-6">
                    <h2 className="font-heading font-semibold text-lg mb-5 flex items-center gap-2">
                        <User className="w-5 h-5 text-purple-400" /> Profile
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="your-username"
                                className="w-full px-4 py-2.5 bg-[hsl(var(--input))] border border-[hsl(var(--border))] rounded-xl text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:border-[hsl(var(--primary)/0.5)] transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell the community about yourself..."
                                rows={3}
                                className="w-full px-4 py-2.5 bg-[hsl(var(--input))] border border-[hsl(var(--border))] rounded-xl text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:border-[hsl(var(--primary)/0.5)] transition-colors resize-none"
                            />
                        </div>
                    </div>
                </section>

                {/* Wallet */}
                <section className="glass rounded-2xl p-6 mb-6">
                    <h2 className="font-heading font-semibold text-lg mb-5 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-green-400" /> Wallet
                    </h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-mono text-sm">{publicKey?.toBase58().slice(0, 16)}...{publicKey?.toBase58().slice(-8)}</p>
                            <p className="text-xs text-green-400 mt-1 font-semibold">● Connected (Devnet)</p>
                        </div>
                        <span className="px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 text-xs font-semibold">Primary</span>
                    </div>
                </section>

                {/* OAuth */}
                <section className="glass rounded-2xl p-6 mb-6">
                    <h2 className="font-heading font-semibold text-lg mb-5 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-400" /> Linked Accounts
                    </h2>
                    <div className="space-y-3">
                        {/* Google */}
                        <div className="flex items-center justify-between py-3 border-b border-[hsl(var(--border))]">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center">
                                    <Chrome className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Google</p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Not linked</p>
                                </div>
                            </div>
                            <button
                                onClick={() => toast.info("Google OAuth — set GOOGLE_CLIENT_ID in .env to enable")}
                                className="px-4 py-1.5 rounded-lg border border-[hsl(var(--border))] text-sm font-medium hover:border-[hsl(var(--primary)/0.5)] transition-colors"
                            >
                                Link
                            </button>
                        </div>

                        {/* GitHub */}
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center">
                                    <Github className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">GitHub</p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Not linked</p>
                                </div>
                            </div>
                            <button
                                onClick={() => toast.info("GitHub OAuth — set GITHUB_CLIENT_ID in .env to enable")}
                                className="px-4 py-1.5 rounded-lg border border-[hsl(var(--border))] text-sm font-medium hover:border-[hsl(var(--primary)/0.5)] transition-colors"
                            >
                                Link
                            </button>
                        </div>
                    </div>
                </section>

                {/* Save */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-[hsl(var(--primary))] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 hover:shadow-[var(--glow-purple)]"
                >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            <Footer />
        </div>
    );
}
