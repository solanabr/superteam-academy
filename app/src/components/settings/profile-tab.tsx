"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Upload, ExternalLink } from "lucide-react";

const PROFILE_STORAGE_KEY = "sta-profile";

function loadProfile() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function ProfileTab() {
  const t = useTranslations("settings");
  const profileInit = loadProfile();
  const [saved, setSaved] = useState(false);
  const [displayName, setDisplayName] = useState(profileInit?.displayName || "SolDev.eth");
  const [bio, setBio] = useState(
    profileInit?.bio || "Solana developer and DeFi enthusiast. Building the future of decentralized education on-chain."
  );
  const [twitter, setTwitter] = useState(profileInit?.twitter || "@soldev_eth");
  const [github, setGithub] = useState(profileInit?.github || "soldev-eth");
  const [discord, setDiscord] = useState(profileInit?.discord || "soldev.eth#1234");
  const [avatar, setAvatar] = useState<string | null>(profileInit?.avatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) return; // 500KB limit
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAvatar(base64);
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({ displayName, bio, twitter, github, discord, avatar })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-8">
      {/* Avatar Section */}
      <div>
        <h3 className="text-lg font-semibold">{t("profileSection.avatar")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("profileSection.avatarDescription")}
        </p>
        <div className="mt-4 flex items-center gap-6">
          {avatar ? (
            <Image
              src={avatar}
              alt="Avatar"
              width={80}
              height={80}
              className="h-20 w-20 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl font-bold text-muted-foreground">
              {displayName.split(/[\s.]/).filter(Boolean).map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "??"}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Upload className="h-4 w-4" />
            {t("profileSection.changeAvatar")}
          </button>
        </div>
      </div>

      {/* Display Name */}
      <div>
        <label
          htmlFor="displayName"
          className="block text-sm font-medium text-foreground"
        >
          {t("profileSection.displayName")}
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mt-2 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-st-green focus:outline-none focus:ring-1 focus:ring-st-green"
          placeholder={t("profileSection.displayNamePlaceholder")}
        />
      </div>

      {/* Bio */}
      <div>
        <label
          htmlFor="bio"
          className="block text-sm font-medium text-foreground"
        >
          {t("profileSection.bio")}
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="mt-2 w-full resize-none rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-st-green focus:outline-none focus:ring-1 focus:ring-st-green"
          placeholder={t("profileSection.bioPlaceholder")}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {bio.length}/280 characters
        </p>
      </div>

      {/* Social Links */}
      <div>
        <h3 className="text-lg font-semibold">{t("profileSection.socialLinks")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("profileSection.socialLinksDescription")}
        </p>
        <div className="mt-4 space-y-4">
          {/* Twitter */}
          <div>
            <label
              htmlFor="twitter"
              className="flex items-center gap-2 text-sm font-medium text-foreground"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              {t("profileSection.twitterHandle")}
            </label>
            <input
              id="twitter"
              type="text"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-st-green focus:outline-none focus:ring-1 focus:ring-st-green"
              placeholder="@username"
            />
          </div>

          {/* GitHub */}
          <div>
            <label
              htmlFor="github"
              className="flex items-center gap-2 text-sm font-medium text-foreground"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              {t("profileSection.githubUsername")}
            </label>
            <input
              id="github"
              type="text"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-st-green focus:outline-none focus:ring-1 focus:ring-st-green"
              placeholder="username"
            />
          </div>

          {/* Discord */}
          <div>
            <label
              htmlFor="discord"
              className="flex items-center gap-2 text-sm font-medium text-foreground"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              {t("profileSection.discordUsername")}
            </label>
            <input
              id="discord"
              type="text"
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-st-green focus:outline-none focus:ring-1 focus:ring-st-green"
              placeholder="username#0000"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-st-green px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-st-green-dark"
        >
          {saved ? t("profileSection.savedFeedback") : t("saveChanges")}
        </button>
      </div>
    </div>
  );
}
