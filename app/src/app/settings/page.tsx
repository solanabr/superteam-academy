"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { MeshGradient } from "@/components/MeshGradient";
import { GridPattern } from "@/components/GridPattern";
import { 
  Zap, Globe, Moon, Bell, Shield, Key, Trash2, LogOut
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useI18n, languages, Language } from "@/components/I18nProvider";

export default function SettingsPage() {
  const { connected, publicKey } = useWallet();
  const { language, setLanguage, t } = useI18n();
  const [theme, setTheme] = useState("dark");
  const [notifications, setNotifications] = useState({
    email: true,
    achievements: true,
    streaks: true,
    courses: false,
  });

  if (!connected) {
    return (
      <div className="min-h-screen bg-black text-white relative">
        <MeshGradient />
        <GridPattern />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-4">Connect Wallet</h1>
            <p className="text-white/60 mb-8">Connect your wallet to access settings</p>
            <Link href="/" className="px-6 py-3 bg-white text-black rounded-md font-medium hover:bg-white/90 transition-colors">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <MeshGradient />
      <GridPattern />
      
      <main className="pt-14 relative z-10">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-semibold mb-8">Settings</h1>

          {/* Profile Section */}
          <section className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-medium mb-6">Profile</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Display Name</label>
                <input
                  type="text"
                  defaultValue="Solana Developer"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:outline-none focus:border-white/20"
                />
              </div>
              
              <div>
                <label className="block text-sm text-white/60 mb-2">Bio</label>
                <textarea
                  rows={3}
                  defaultValue="Building the future of decentralized applications."
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:outline-none focus:border-white/20 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-white/60 mb-2">Wallet Address</label>
                <input
                  type="text"
                  value={publicKey?.toString() || ""}
                  disabled
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-md text-white/40 font-mono text-sm"
                />
              </div>
            </div>
          </section>

          {/* Preferences */}
          <section className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-medium mb-6">Preferences</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-white/40" />
                  <div>
                    <div className="font-medium">Language</div>
                    <div className="text-white/40 text-sm">Choose your preferred language</div>
                  </div>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:outline-none focus:border-white/20"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-white/40" />
                  <div>
                    <div className="font-medium">Theme</div>
                    <div className="text-white/40 text-sm">Choose light or dark mode</div>
                  </div>
                </div>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:outline-none focus:border-white/20"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-medium mb-6">Notifications</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-white/40 text-sm">Receive updates via email</div>
                </div>
                <button
                  onClick={() => setNotifications(n => ({ ...n, email: !n.email }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notifications.email ? "bg-yellow-400" : "bg-white/20"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    notifications.email ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Achievement Alerts</div>
                  <div className="text-white/40 text-sm">Get notified when you earn badges</div>
                </div>
                <button
                  onClick={() => setNotifications(n => ({ ...n, achievements: !n.achievements }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notifications.achievements ? "bg-yellow-400" : "bg-white/20"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    notifications.achievements ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Streak Reminders</div>
                  <div className="text-white/40 text-sm">Daily reminders to maintain streak</div>
                </div>
                <button
                  onClick={() => setNotifications(n => ({ ...n, streaks: !n.streaks }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notifications.streaks ? "bg-yellow-400" : "bg-white/20"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    notifications.streaks ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
            </div>
          </section>

          {/* Account */}
          <section className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-medium mb-6">Account</h2>
            
            <div className="space-y-4">
              <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/5 transition-colors">
                <Key className="w-5 h-5 text-white/40" />
                <span>Connected Wallets</span>
              </button>
              
              <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/5 transition-colors">
                <Shield className="w-5 h-5 text-white/40" />
                <span>Privacy Settings</span>
              </button>
              
              <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/5 transition-colors text-red-400">
                <LogOut className="w-5 h-5" />
                <span>Disconnect Wallet</span>
              </button>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end">
            <button className="px-6 py-2 bg-white text-black rounded-md font-medium hover:bg-white/90 transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
