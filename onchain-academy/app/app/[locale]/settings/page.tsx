"use client";

import { useState, useTransition, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, usePathname, useRouter } from "@/src/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import {
    ArrowLeft,
    Bell,
    Camera,
    Download,
    Eye,
    EyeOff,
    Github,
    Globe,
    Key,
    Laptop,
    Lock,
    LogOut,
    Mail,
    Moon,
    Palette,
    Save,
    Shield,
    Sun,
    Twitter,
    User,
    Wallet,
    Zap,
    Terminal,
    Loader2,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { profileApi } from "@/lib/profile";

const tabs = ["Profile", "Account", "Preferences", "Privacy"] as const;

export default function SettingsPage() {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Profile");

    /* Profile form state */
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [twitter, setTwitter] = useState("");
    const [github, setGithub] = useState("");
    const [website, setWebsite] = useState("");
    const [avatar, setAvatar] = useState("");

    /* Preferences state */
    const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
    const [lang, setLang] = useState("en");

    /* Privacy state */
    const [profileVisibility, setProfileVisibility] = useState(true);
    const [showXP, setShowXP] = useState(true);
    const [showStreak, setShowStreak] = useState(true);

    /* Notification state */
    const [notifications, setNotifications] = useState({
        streaks: true,
        achievements: true,
        updates: true,
        marketing: true,
    });

    /* UI State */
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Hydrate form from API
    useEffect(() => {
        profileApi.getMe().then(res => {
            const p = res.data.profile;
            setName(p.name || "");
            setBio(p.bio || "");
            setTwitter(p.twitter || "");
            setGithub(p.github || "");
            setWebsite(p.website || "");
            setAvatar(p.avatar || "");
            setTheme((p.theme as any) || "dark");
            setLang(p.language || "en");
            setProfileVisibility(p.isPublic ?? true);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to fetch settings:", err);
            setLoading(false);
        });
    }, []);

    const handleSave = async (data: any) => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const res = await profileApi.updateMe(data);
            if (res.success) {
                setSuccess("Protocol updated successfully.");
                // Sync global auth state
                if (user) {
                    updateUser({
                        ...user,
                        name: res.data.profile.name,
                        avatar: res.data.profile.avatar,
                        username: res.data.profile.username
                    } as any);
                }
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err: any) {
            setError(err.message || "Protocol update failed.");
        } finally {
            setSaving(false);
        }
    };

    const tabIcons: Record<typeof tabs[number], typeof User> = {
        Profile: User,
        Account: Key,
        Preferences: Palette,
        Privacy: Shield,
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050810] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050810] flex flex-col font-sans relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.015] to-transparent" />
            </div>

            {/* Top Bar */}
            <header className="relative z-10 border-b border-white/5 bg-white/[0.02]">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-neon-cyan transition-colors group font-mono">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        cd ../dashboard
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 border border-white/10 bg-white/5 flex items-center justify-center text-white">
                            <Zap className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-black text-white tracking-widest uppercase font-mono">Osmos</span>
                    </div>
                </div>
            </header>

            <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-6 py-10 md:py-16">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-neon-cyan font-mono text-sm">{">"}</span>
                        <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
                            system_settings
                        </span>
                        <div className="hidden sm:block w-24 h-px bg-white/[0.06]" />
                    </div>
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">Configuration</h1>
                            <p className="text-sm text-zinc-400 font-mono mt-2 flex items-center gap-2">
                                <span className="text-neon-cyan/60">// </span> Manage your account protocols and preferences
                            </p>
                        </div>
                        <AnimatePresence>
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 flex items-center gap-2 text-emerald-400 font-mono text-[10px] uppercase font-bold tracking-widest"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> {success}
                                </motion.div>
                            )}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-red-500/10 border border-red-500/20 px-4 py-2 flex items-center gap-2 text-red-400 font-mono text-[10px] uppercase font-bold tracking-widest"
                                >
                                    <AlertCircle className="w-3.5 h-3.5" /> {error}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* ── Sidebar tabs ── */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="md:w-60 shrink-0">
                        <nav className="space-y-2 relative">
                            {/* Decorative line */}
                            <div className="absolute left-0 top-0 bottom-0 w-px bg-white/[0.06] hidden md:block" />

                            {tabs.map((tab) => {
                                const Icon = tabIcons[tab];
                                const isActive = activeTab === tab;
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold font-mono transition-all uppercase tracking-wider relative group ${isActive
                                            ? "text-neon-cyan bg-neon-cyan/5 border border-neon-cyan/20"
                                            : "text-zinc-500 hover:text-white border border-transparent hover:border-white/5 hover:bg-white/[0.02]"
                                            }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTabIndicator"
                                                className="absolute left-0 top-0 bottom-0 w-1 bg-neon-cyan"
                                            />
                                        )}
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-neon-cyan' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                                        {tab}
                                    </button>
                                );
                            })}
                        </nav>
                    </motion.div>

                    {/* ── Content ── */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex-1 min-w-0">

                        {/* ── Profile Tab ── */}
                        {activeTab === "Profile" && (
                            <div className="space-y-6">
                                {/* Profile Editor Card */}
                                <div className="border border-white/[0.06] bg-[#0a0f1a]/90 p-6 md:p-8 space-y-8">
                                    <div className="flex items-center gap-2 font-mono border-b border-white/5 pb-4 mb-4">
                                        <Terminal className="w-4 h-4 text-neon-cyan" />
                                        <span className="text-sm font-bold text-white uppercase tracking-wider">Identity Details</span>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                                        <div className="relative group shrink-0">
                                            <div className="w-24 h-24 bg-white/[0.02] border border-white/10 flex items-center justify-center overflow-hidden">
                                                {avatar ? (
                                                    <img src={avatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-8 h-8 text-zinc-600" />
                                                )}
                                            </div>
                                            <button className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 border border-neon-cyan/50">
                                                <Camera className="w-5 h-5 text-neon-cyan" />
                                                <span className="text-[9px] font-mono text-neon-cyan uppercase tracking-widest">Update</span>
                                            </button>

                                            {/* Corner brackets */}
                                            <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-neon-cyan/50" />
                                            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-neon-cyan/50" />
                                        </div>
                                        <div className="font-mono space-y-1">
                                            <div className="text-sm font-bold text-white uppercase">Profile Avatar</div>
                                            <div className="text-[10px] text-zinc-500 tracking-wider">JPG, PNG OR GIF. MAX 2MB.</div>
                                            <div className="text-[10px] text-zinc-600 bg-white/5 border border-white/10 px-2 py-0.5 inline-block mt-2">128x128px RECOMMENDED</div>
                                        </div>
                                    </div>

                                    {/* Form fields */}
                                    <div className="space-y-5 font-mono">
                                        <div>
                                            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
                                                <span className="w-1 h-1 bg-neon-cyan" /> Display Name
                                            </label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-neon-cyan/50 focus:bg-white/[0.04] transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
                                                <span className="w-1 h-1 bg-neon-cyan" /> Developer Bio
                                            </label>
                                            <textarea
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                rows={4}
                                                className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-neon-cyan/50 focus:bg-white/[0.04] transition-colors resize-none leading-relaxed"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Social links */}
                                <div className="border border-white/[0.06] bg-[#0a0f1a]/90 p-6 md:p-8 space-y-6 font-mono">
                                    <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-2">
                                        <Globe className="w-4 h-4 text-amber-400" />
                                        <span className="text-sm font-bold text-white uppercase tracking-wider">External Links</span>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { icon: Twitter, label: "Twitter", value: twitter, setter: setTwitter, prefix: "@", color: "text-sky-400" },
                                            { icon: Github, label: "GitHub", value: github, setter: setGithub, prefix: "", color: "text-white" },
                                            { icon: Globe, label: "Website", value: website, setter: setWebsite, prefix: "", color: "text-emerald-400" },
                                        ].map((social) => (
                                            <div key={social.label}>
                                                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                                    {social.label}
                                                </label>
                                                <div className="flex items-center relative">
                                                    <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center bg-white/[0.02] border-r border-white/[0.08]">
                                                        <social.icon className={`w-4 h-4 ${social.color}`} />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={social.value}
                                                        onChange={(e) => social.setter(e.target.value)}
                                                        placeholder={social.label}
                                                        className="w-full pl-16 pr-4 py-3 bg-white/[0.02] border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400/50 focus:bg-white/[0.04] transition-colors"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={saving}
                                        onClick={() => handleSave({ name, bio, twitter, github, website })}
                                        className="btn-hacker bg-white/10 disabled:opacity-50 text-white font-black font-mono uppercase tracking-wider transition-all duration-300 relative overflow-hidden flex items-center gap-2 px-8 py-4"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin text-neon-cyan" /> : <Save className="w-4 h-4" />}
                                        Save Identity
                                    </motion.button>
                                </div>
                            </div>
                        )}

                        {/* ── Account Tab ── */}
                        {activeTab === "Account" && (
                            <div className="space-y-6 font-mono">
                                {/* Email */}
                                <div className="p-6 border border-white/[0.06] bg-[#0a0f1a]/90 space-y-4">
                                    <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                                        <Mail className="w-4 h-4 text-neon-cyan" />
                                        <span className="text-sm font-bold text-white uppercase tracking-wider">Email Address</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input type="email" value="alex@example.com" readOnly className="flex-1 px-4 py-3 rounded-none bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-400 focus:outline-none" />
                                        <button className="px-6 py-3 border border-white/[0.08] bg-white/[0.02] text-xs font-bold text-white uppercase tracking-widest hover:bg-white/5 hover:border-white/20 transition-all">Update</button>
                                    </div>
                                    <p className="text-[10px] text-zinc-500">Your email is not displayed globally by default.</p>
                                </div>

                                {/* Connected Wallets */}
                                <div className="p-6 border border-white/[0.06] bg-[#0a0f1a]/90 space-y-4">
                                    <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                                        <Wallet className="w-4 h-4 text-neon-purple" />
                                        <span className="text-sm font-bold text-white uppercase tracking-wider">Connected Wallets</span>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.06] relative group">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-neon-purple group-hover:w-1.5 transition-all" />
                                        <div className="w-10 h-10 bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center">
                                            <Wallet className="w-5 h-5 text-neon-purple" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-white flex items-center gap-2">
                                                Phantom Wallet
                                                <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest bg-neon-green/10 text-neon-green border border-neon-green/20">Active</span>
                                            </div>
                                            <div className="text-[10px] text-zinc-500 mt-1 truncate select-all">8xK3MwX7y...J4v7Rp9Z</div>
                                        </div>
                                        <button className="text-[10px] font-bold text-red-500 hover:text-white px-3 py-1.5 border border-transparent hover:border-red-500/30 uppercase tracking-widest transition-colors">
                                            Disconnect
                                        </button>
                                    </div>
                                    <button className="w-full p-4 border border-dashed border-white/[0.1] text-xs font-bold text-zinc-400 uppercase tracking-widest hover:text-white hover:border-white/[0.2] hover:bg-white/[0.02] transition-colors flex items-center justify-center gap-2">
                                        <span className="text-neon-purple">+</span> Add Wallet
                                    </button>
                                </div>

                                {/* OAuth Providers */}
                                <div className="p-6 border border-white/[0.06] bg-[#0a0f1a]/90 space-y-4">
                                    <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                                        <Shield className="w-4 h-4 text-amber-400" />
                                        <span className="text-sm font-bold text-white uppercase tracking-wider">Auth Providers</span>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { name: "Google", icon: Globe, connected: true, color: "text-red-400" },
                                            { name: "GitHub", icon: Github, connected: false, color: "text-white" },
                                        ].map((provider) => (
                                            <div key={provider.name} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.06]">
                                                <div className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10">
                                                    <provider.icon className={`w-4 h-4 ${provider.color}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-white">{provider.name}</div>
                                                    <div className="text-[10px] text-zinc-500 mt-0.5">{provider.connected ? "Authenticated" : "Not connected"}</div>
                                                </div>
                                                {provider.connected ? (
                                                    <button className="text-[10px] font-bold text-zinc-500 hover:text-white px-3 py-1.5 border border-white/10 hover:border-white/30 uppercase tracking-widest transition-colors">
                                                        Unlink
                                                    </button>
                                                ) : (
                                                    <button className="text-[10px] font-bold text-black bg-white hover:bg-zinc-200 px-3 py-1.5 uppercase tracking-widest transition-colors">
                                                        Link
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Danger Zone */}
                                <div className="p-6 border border-red-500/20 bg-red-500/5 relative overflow-hidden">
                                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                                    <div className="flex items-center gap-2 border-b border-red-500/10 pb-4 mb-4">
                                        <LogOut className="w-4 h-4 text-red-400" />
                                        <span className="text-sm font-bold text-red-500 uppercase tracking-wider drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">Danger Zone</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                                        <div>
                                            <div className="text-sm font-bold text-white">Purge Account</div>
                                            <div className="text-[10px] text-red-400/80 mt-1 max-w-sm">Permanently delete your account, progress, and all associated data. This action cannot be reversed.</div>
                                        </div>
                                        <button className="px-6 py-3 border border-red-500 text-xs font-black text-red-500 uppercase tracking-widest hover:bg-red-500 hover:text-black transition-all">
                                            Initiate Purge
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Preferences Tab ── */}
                        {activeTab === "Preferences" && (
                            <div className="space-y-6 font-mono">
                                {/* Theme */}
                                <div className="p-6 border border-white/[0.06] bg-[#0a0f1a]/90 space-y-5">
                                    <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                                        <Palette className="w-4 h-4 text-neon-green" />
                                        <span className="text-sm font-bold text-white uppercase tracking-wider">Interface Theme</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {([
                                            { value: "dark", label: "Dark Mode", icon: Moon, desc: "Default" },
                                            { value: "light", label: "Light Mode", icon: Sun, desc: "High Contrast" },
                                            { value: "system", label: "System Sync", icon: Laptop, desc: "Auto Match" },
                                        ] as const).map(({ value, label, icon: Icon, desc }) => (
                                            <button
                                                key={value}
                                                onClick={() => setTheme(value)}
                                                className={`flex flex-col items-center justify-center gap-3 p-4 border transition-all relative overflow-hidden group ${theme === value
                                                    ? "border-neon-green bg-neon-green/5"
                                                    : "border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/20"
                                                    }`}
                                            >
                                                {theme === value && (
                                                    <div className="absolute top-0 right-0 w-0 h-0 border-t-[16px] border-r-[16px] border-t-neon-green border-r-transparent" />
                                                )}
                                                <Icon className={`w-6 h-6 ${theme === value ? 'text-neon-green' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                                                <div className="text-center">
                                                    <div className={`text-xs font-bold uppercase tracking-wider ${theme === value ? 'text-neon-green' : 'text-zinc-400'}`}>{label}</div>
                                                    <div className="text-[9px] text-zinc-600 mt-1">{desc}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Language */}
                                <div className="p-6 border border-white/[0.06] bg-[#0a0f1a]/90 space-y-5">
                                    <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                                        <Globe className="w-4 h-4 text-neon-purple" />
                                        <span className="text-sm font-bold text-white uppercase tracking-wider">Localization</span>
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={lang}
                                            onChange={(e) => setLang(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] text-xs font-bold uppercase tracking-widest text-white focus:outline-none focus:border-neon-purple/50 transition-colors appearance-none cursor-pointer"
                                        >
                                            <option value="en">English (US)</option>
                                            <option value="pt-br">Português (BR)</option>
                                            <option value="es">Español (ES)</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                            ▼
                                        </div>
                                    </div>
                                </div>

                                {/* Notifications */}
                                <div className="p-6 border border-white/[0.06] bg-[#0a0f1a]/90 space-y-6">
                                    <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                                        <Bell className="w-4 h-4 text-amber-400" />
                                        <span className="text-sm font-bold text-white uppercase tracking-wider">Comms & Alerts</span>
                                    </div>
                                    <div className="space-y-1 bg-white/[0.01] border border-white/5 p-2">
                                        {[
                                            { key: "streaks" as const, label: "Streak Reminders", desc: "Get notified before you lose your daily streak" },
                                            { key: "achievements" as const, label: "Loot & Badges", desc: "Alerts when you unlock new achievements" },
                                            { key: "updates" as const, label: "System Updates", desc: "New course drops and platform changes" },
                                            { key: "marketing" as const, label: "Ecosystem News", desc: "General Solana and Osmos updates" },
                                        ].map((n, i) => (
                                            <div key={n.key} className={`flex items-center justify-between p-3 ${i !== 0 ? 'border-t border-white/5' : ''}`}>
                                                <div>
                                                    <div className="text-xs font-bold text-white uppercase tracking-wider mb-0.5">{n.label}</div>
                                                    <div className="text-[10px] text-zinc-500">{n.desc}</div>
                                                </div>
                                                <button
                                                    onClick={() => setNotifications({ ...notifications, [n.key]: !notifications[n.key] })}
                                                    className={`w-12 h-6 border transition-all relative flex flex-col justify-center ${notifications[n.key] ? "bg-amber-400/20 border-amber-400" : "bg-black border-white/20"}`}
                                                >
                                                    <motion.div
                                                        animate={{ x: notifications[n.key] ? 24 : 0 }}
                                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                        className={`absolute left-[2px] w-[20px] h-[18px] bg-white transition-colors ${notifications[n.key] ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-zinc-600'}`}
                                                    />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={saving}
                                        onClick={() => handleSave({ theme, language: lang })}
                                        className="btn-hacker bg-white/10 disabled:opacity-50 text-white font-black font-mono uppercase tracking-wider transition-all duration-300 relative overflow-hidden flex items-center gap-2 px-8 py-4"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin text-neon-green" /> : <Save className="w-4 h-4" />}
                                        Save Config
                                    </motion.button>
                                </div>
                            </div>
                        )}

                        {/* ── Privacy Tab ── */}
                        {activeTab === "Privacy" && (
                            <div className="space-y-6 font-mono">
                                <div className="p-6 border border-white/[0.06] bg-[#0a0f1a]/90 space-y-6">
                                    <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                                        <Shield className="w-4 h-4 text-neon-cyan" />
                                        <span className="text-sm font-bold text-white uppercase tracking-wider">Visibility Matrix</span>
                                    </div>
                                    <div className="space-y-1">
                                        {[
                                            { label: "Public Profile", desc: "Anyone can view your profile URL", value: profileVisibility, setter: setProfileVisibility },
                                            { label: "Display Stats", desc: "Show XP, Level, and Arena Rank globally", value: showXP, setter: setShowXP },
                                            { label: "Display Streak", desc: "Make your current streak visible to others", value: showStreak, setter: setShowStreak },
                                        ].map((setting, i) => (
                                            <div key={setting.label} className={`flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.03] transition-colors ${i > 0 ? "mt-2" : ""}`}>
                                                <div>
                                                    <div className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider mb-1">
                                                        {setting.value ? <Eye className="w-3.5 h-3.5 text-neon-cyan" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-500" />}
                                                        {setting.label}
                                                    </div>
                                                    <div className="text-[10px] text-zinc-500 ml-5.5">{setting.desc}</div>
                                                </div>
                                                <button
                                                    onClick={() => setting.setter(!setting.value)}
                                                    className={`w-12 h-6 border transition-all relative flex flex-col justify-center ${setting.value ? "bg-neon-cyan/20 border-neon-cyan" : "bg-black border-white/20"}`}
                                                >
                                                    <motion.div
                                                        animate={{ x: setting.value ? 24 : 0 }}
                                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                        className={`absolute left-[2px] w-[20px] h-[18px] transition-colors ${setting.value ? 'bg-neon-cyan shadow-[0_0_8px_rgba(0,255,255,0.5)]' : 'bg-zinc-600'}`}
                                                    />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Data export */}
                                <div className="p-6 border border-white/[0.06] bg-[#0a0f1a]/90 space-y-4">
                                    <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                                        <Download className="w-4 h-4 text-white" />
                                        <span className="text-sm font-bold text-white uppercase tracking-wider">Data Extraction</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 leading-relaxed max-w-lg">
                                        Download a portable copy of all your on-chain and off-chain data bound to this account, including course completions and configuration JSON.
                                    </p>
                                    <button className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 border border-white/[0.1] bg-white/[0.03] text-xs font-bold text-white uppercase tracking-widest hover:bg-white/[0.08] hover:border-white/[0.2] transition-all">
                                        <Download className="w-4 h-4" /> Export Data Payload
                                    </button>
                                </div>

                                <div className="flex justify-end">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={saving}
                                        onClick={() => handleSave({ isPublic: profileVisibility })}
                                        className="btn-hacker bg-white/10 disabled:opacity-50 text-white font-black font-mono uppercase tracking-wider transition-all duration-300 relative overflow-hidden flex items-center gap-2 px-8 py-4"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin text-neon-cyan" /> : <Save className="w-4 h-4" />}
                                        Save Security Rules
                                    </motion.button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
