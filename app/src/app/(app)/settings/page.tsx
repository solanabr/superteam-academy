"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Settings, User, Wallet, Shield } from "lucide-react";
import {
  ProfileTab,
  AccountTab,
  PreferencesTab,
  PrivacyTab,
} from "@/components/settings";

type Tab = "profile" | "account" | "preferences" | "privacy";

const TAB_KEYS: Tab[] = ["profile", "account", "preferences", "privacy"];

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  profile: <User className="h-4 w-4" />,
  account: <Wallet className="h-4 w-4" />,
  preferences: <Settings className="h-4 w-4" />,
  privacy: <Shield className="h-4 w-4" />,
};

const TAB_LABEL_KEYS: Record<Tab, string> = {
  profile: "profile",
  account: "account",
  preferences: "preferences",
  privacy: "privacy",
};

export default function SettingsPage() {
  const t = useTranslations("settings");
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Tab Navigation + Content */}
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Sidebar Tabs */}
        <nav className="flex flex-row gap-1 md:w-56 md:flex-col md:shrink-0">
          {TAB_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === key
                  ? "bg-st-green/10 text-st-green"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {TAB_ICONS[key]}
              {t(TAB_LABEL_KEYS[key])}
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <div className="min-w-0 flex-1">
          <div className="glass rounded-xl p-6 sm:p-8">
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "account" && <AccountTab />}
            {activeTab === "preferences" && <PreferencesTab />}
            {activeTab === "privacy" && <PrivacyTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
