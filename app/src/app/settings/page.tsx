"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { MeshGradient } from "@/components/MeshGradient";
import { User, Bell, Globe, Shield, Wallet, LogOut, Save, ChevronRight, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/components/I18nProvider";
import { useState } from "react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { t, language, setLanguage } = useI18n();
  const { connected, publicKey, disconnect } = useWallet();
  const [activeSection, setActiveSection] = useState("profile");

  const [profile, setProfile] = useState({
    username: "SolanaBuilder",
    bio: "Building the future of decentralized apps.",
  });

  const handleSaveProfile = () => {
    toast.success(t("settings.profile.save"));
  };

  const sections = [
    { id: "profile", icon: User, label: t("settings.profile.title") },
    { id: "preferences", icon: Globe, label: t("settings.preferences.title") },
    { id: "wallet", icon: Wallet, label: t("settings.wallet.title") },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 z-0">
        <MeshGradient />
      </div>

      <main className="relative z-10 pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">{t("settings.title")}</h1>

          <div className="grid grid-cols-1 md:grid-cols-[240px,1fr] gap-8">
            {/* Sidebar */}
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === section.id
                        ? "bg-white/10 text-white border border-white/10"
                        : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent"
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {section.label}
                  </button>
                );
              })}
            </nav>

            {/* Content */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
              {activeSection === "profile" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold mb-6">{t("settings.profile.title")}</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/40 mb-2">{t("settings.profile.username")}</label>
                      <input
                        type="text"
                        value={profile.username}
                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/40 mb-2">{t("settings.profile.bio")}</label>
                      <textarea
                        rows={4}
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 transition-colors"
                      />
                    </div>
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {t("settings.profile.save")}
                    </button>
                  </div>
                </motion.div>
              )}

              {activeSection === "preferences" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <h2 className="text-2xl font-bold mb-6">{t("settings.preferences.title")}</h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm text-white/40 mb-4">{t("settings.preferences.language")}</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: "en", label: "English" },
                          { id: "pt-BR", label: "Português" },
                          { id: "es", label: "Español" }
                        ].map((lang) => (
                          <button
                            key={lang.id}
                            onClick={() => setLanguage(lang.id as any)}
                            className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${language === lang.id
                                ? "bg-white text-black border-white"
                                : "bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white"
                              }`}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{t("settings.preferences.notifications")}</div>
                          <div className="text-xs text-white/40">Updates about your courses and achievements</div>
                        </div>
                        <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-not-allowed opacity-50">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{t("settings.preferences.marketing")}</div>
                          <div className="text-xs text-white/40">New courses and ecosystem news</div>
                        </div>
                        <div className="w-12 h-6 bg-white/10 rounded-full relative cursor-not-allowed opacity-50">
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white/40 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === "wallet" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold mb-6">{t("settings.wallet.title")}</h2>

                  {!connected ? (
                    <div className="text-center py-12">
                      <Wallet className="w-12 h-12 text-white/10 mx-auto mb-4" />
                      <p className="text-white/40 mb-6 font-medium">{t("achievements.connectWallet")}</p>
                      <button className="px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors">
                        {t("nav.connectWallet")}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="text-xs text-white/40 mb-1">{t("settings.wallet.connected")}</div>
                        <div className="font-mono text-sm break-all text-white/80">{publicKey?.toString()}</div>
                      </div>

                      <button
                        onClick={() => disconnect()}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-400 rounded-xl font-bold hover:bg-red-500/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {t("settings.wallet.disconnect")}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
