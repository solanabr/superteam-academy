"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTheme } from "next-themes";
import {
  User,
  Moon,
  Sun,
  Monitor,
  Globe,
  Bell,
  Shield,
  Wallet,
  Save,
  Link as LinkIcon,
  Copy,
  CheckCircle2,
  Trash2,
  LogOut,
  Download,
} from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

const languages = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "pt-BR", label: "Português (BR)", flag: "🇧🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

export default function SettingsPage() {
  const { connected, publicKey, disconnect } = useWallet();
  const { theme, setTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    achievements: true,
    streakReminder: true,
    newCourses: false,
    weeklyDigest: true,
  });

  const walletShort = publicKey?.toBase58() ?? "";

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success("Settings saved!");
  };

  const copyWallet = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Wallet address copied!");
    }
  };

  const handleLocaleChange = (locale: string) => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <PageLayout>
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
          </motion.div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-white/5 border border-white/10 flex flex-wrap h-auto">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />Profile
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />Account
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />Preferences
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />Privacy
              </TabsTrigger>
            </TabsList>

            {/* Profile tab */}
            <TabsContent value="profile">
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                className="glass-card p-6 space-y-6"
              >
                <h2 className="font-semibold">Profile Information</h2>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-3xl font-bold text-white">
                    {name.charAt(0).toUpperCase() || "S"}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Profile photo</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Avatar generated from your wallet address
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Display Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Username</label>
                    <Input
                      placeholder="@username"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the community about yourself..."
                    rows={3}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Twitter</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                      <Input
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        placeholder="username"
                        className="pl-7 bg-white/5 border-white/10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5">GitHub</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                      <Input
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        placeholder="username"
                        className="pl-7 bg-white/5 border-white/10"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="gradient"
                    onClick={handleSave}
                    disabled={saving}
                    className="gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </TabsContent>

            {/* Account tab */}
            <TabsContent value="account">
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Wallet */}
                <div className="glass-card p-6">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-[#9945FF]" />
                    Connected Wallet
                  </h2>
                  {connected && publicKey ? (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#14F195]/5 border border-[#14F195]/20">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#14F195] animate-pulse" />
                        <span className="font-mono text-sm">{walletShort.slice(0, 20)}...</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={copyWallet}>
                          {copied ? <CheckCircle2 className="h-4 w-4 text-[#14F195]" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => disconnect()}>
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No wallet connected</p>
                  )}
                </div>

                {/* Email */}
                <div className="glass-card p-6">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-[#9945FF]" />
                    Linked Accounts
                  </h2>
                  <div className="space-y-3">
                    {[
                      { icon: "🔵", name: "Google", connected: false },
                      { icon: "⚫", name: "GitHub", connected: false },
                    ].map((account) => (
                      <div key={account.name} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{account.icon}</span>
                          <span className="text-sm font-medium">{account.name}</span>
                        </div>
                        <Button variant={account.connected ? "destructive" : "glass"} size="sm">
                          {account.connected ? "Disconnect" : "Connect"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Preferences tab */}
            <TabsContent value="preferences">
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Theme */}
                <div className="glass-card p-6">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <Sun className="h-4 w-4 text-yellow-500" />
                    Theme
                  </h2>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "dark", label: "Dark", icon: Moon },
                      { value: "light", label: "Light", icon: Sun },
                      { value: "system", label: "System", icon: Monitor },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setTheme(value)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                          theme === value
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div className="glass-card p-6">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#00C2FF]" />
                    Language
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLocaleChange(lang.code)}
                        className="flex items-center gap-3 p-3 rounded-xl border bg-white/5 border-white/10 hover:bg-white/10 transition-all text-left"
                      >
                        <span className="text-2xl">{lang.flag}</span>
                        <span className="text-sm font-medium">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notifications */}
                <div className="glass-card p-6">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <Bell className="h-4 w-4 text-[#9945FF]" />
                    Notifications
                  </h2>
                  <div className="space-y-3">
                    {Object.entries(notifications).map(([key, value]) => {
                      const labels: Record<string, string> = {
                        achievements: "New achievement unlocked",
                        streakReminder: "Daily streak reminder",
                        newCourses: "New courses available",
                        weeklyDigest: "Weekly progress digest",
                      };
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm">{labels[key]}</span>
                          <button
                            onClick={() => setNotifications(prev => ({ ...prev, [key]: !value }))}
                            className={cn(
                              "w-10 h-5 rounded-full transition-all relative",
                              value ? "bg-[#14F195]" : "bg-white/20"
                            )}
                          >
                            <div className={cn(
                              "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow",
                              value ? "left-5" : "left-0.5"
                            )} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Privacy tab */}
            <TabsContent value="privacy">
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="glass-card p-6">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#9945FF]" />
                    Privacy Settings
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                      <div>
                        <p className="text-sm font-medium">Public Profile</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Allow others to view your profile and achievements
                        </p>
                      </div>
                      <button className="w-10 h-5 rounded-full bg-[#14F195] relative">
                        <div className="absolute top-0.5 left-5 w-4 h-4 rounded-full bg-white shadow" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <Download className="h-4 w-4 text-[#00C2FF]" />
                    Data Management
                  </h2>
                  <div className="space-y-3">
                    <Button variant="glass" className="w-full justify-start gap-2">
                      <Download className="h-4 w-4" />
                      Export My Data
                    </Button>
                    <Button variant="glass" className="w-full justify-start gap-2 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageLayout>
  );
}
