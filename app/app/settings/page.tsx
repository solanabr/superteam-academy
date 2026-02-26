"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import { shortenAddress } from "@/lib/utils";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const languages = [
  { code: "en", label: "ENGLISH" },
  { code: "pt", label: "PORTUGUÊS" },
  { code: "es", label: "ESPAÑOL" },
];

const themes = [
  { id: "dark", label: "DARK" },
  { id: "light", label: "LIGHT" },
];

export default function SettingsPage() {
  const { publicKey, disconnect } = useWallet();
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState("dark");
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#020202]">

      {/* Header */}
      <div className="border-b border-[#1a1a1a] px-6 py-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">// SETTINGS</span>
          <div className="flex-1 h-px bg-[#1a1a1a]" />
        </div>
        <h1 className="font-display font-black text-5xl uppercase tracking-tighter">
          ACCOUNT <span className="text-[#9945ff]">SETTINGS</span>
        </h1>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-px bg-[#1a1a1a]">

        {/* Profile */}
        <div className="bg-[#020202] p-8">
          <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-6">
            // PROFILE_INFO
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-[#444] uppercase tracking-widest mb-2">
                DISPLAY_NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ANON_BUILDER"
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#1a1a1a] text-xs font-mono text-[#f5f5f0] placeholder-[#333] focus:outline-none focus:border-[#9945ff] transition-colors uppercase tracking-widest"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-[#444] uppercase tracking-widest mb-2">
                BIO
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="SOLANA_BUILDER // WEB3_DEVELOPER"
                rows={3}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#1a1a1a] text-xs font-mono text-[#f5f5f0] placeholder-[#333] focus:outline-none focus:border-[#9945ff] transition-colors resize-none uppercase tracking-widest"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-[#444] uppercase tracking-widest mb-2">
                  TWITTER
                </label>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="@HANDLE"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#1a1a1a] text-xs font-mono text-[#f5f5f0] placeholder-[#333] focus:outline-none focus:border-[#9945ff] transition-colors uppercase tracking-widest"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-[#444] uppercase tracking-widest mb-2">
                  GITHUB
                </label>
                <input
                  type="text"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="USERNAME"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#1a1a1a] text-xs font-mono text-[#f5f5f0] placeholder-[#333] focus:outline-none focus:border-[#9945ff] transition-colors uppercase tracking-widest"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Wallet */}
        <div className="bg-[#020202] p-8">
          <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-6">
            // CONNECTED_WALLET
          </div>
          {publicKey ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-mono text-[#f5f5f0] mb-1">
                  {shortenAddress(publicKey.toBase58(), 8)}
                </div>
                <div className="text-[10px] font-mono text-[#444]">
                  SOLANA_DEVNET // CONNECTED
                </div>
              </div>
              <button
                onClick={disconnect}
                className="px-4 py-2 border border-[#ff3366]/30 text-[#ff3366] font-mono text-[10px] uppercase tracking-widest hover:bg-[#ff3366]/10 transition-colors"
              >
                DISCONNECT
              </button>
            </div>
          ) : (
            <div className="text-[10px] font-mono text-[#444] uppercase tracking-widest">
              NO_WALLET_CONNECTED
            </div>
          )}
        </div>

        {/* Language */}
        <div className="bg-[#020202] p-8">
          <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-6">
            // LANGUAGE
          </div>
          <div className="flex gap-px bg-[#1a1a1a]">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  "flex-1 py-3 text-[10px] font-mono uppercase tracking-widest transition-colors",
                  language === lang.code
                    ? "bg-[#9945ff] text-white"
                    : "bg-[#020202] text-[#444] hover:text-[#f5f5f0] hover:bg-[#0a0a0a]"
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="bg-[#020202] p-8">
          <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-6">
            // THEME
          </div>
          <div className="flex gap-px bg-[#1a1a1a] w-fit">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "px-8 py-3 text-[10px] font-mono uppercase tracking-widest transition-colors",
                  theme === t.id
                    ? "bg-[#9945ff] text-white"
                    : "bg-[#020202] text-[#444] hover:text-[#f5f5f0] hover:bg-[#0a0a0a]"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-[#020202] p-8">
          <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-6">
            // PRIVACY
          </div>
          <div className="space-y-4">
            {[
              { label: "PUBLIC_PROFILE", desc: "Allow others to view your profile and progress" },
              { label: "SHOW_XP_BALANCE", desc: "Display XP balance on public profile" },
              { label: "SHOW_CREDENTIALS", desc: "Display earned NFT credentials publicly" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
                <div>
                  <div className="text-[10px] font-mono text-[#f5f5f0] uppercase tracking-widest mb-1">
                    {item.label}
                  </div>
                  <div className="text-[10px] font-mono text-[#333]">{item.desc}</div>
                </div>
                <div className="w-8 h-4 bg-[#9945ff] relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <div className="bg-[#020202] p-8">
          <button
            onClick={handleSave}
            className={cn(
              "w-full py-3 font-mono text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2",
              saved
                ? "bg-[#14f195] text-black"
                : "bg-[#9945ff] text-white hover:bg-[#8835ef]"
            )}
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                SAVED_SUCCESSFULLY
              </>
            ) : (
              "SAVE_CHANGES"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}