"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Upload, ExternalLink, Loader2 } from "lucide-react";

export function ProfileTab() {
  const t = useTranslations("settings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [displayName, setDisplayName] = useState("Learner");
  const [bio, setBio] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [discord, setDiscord] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile from the DB-backed API endpoint
  useEffect(() => {
    fetch("/api/user")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) {
          // Fall back to localStorage if not authenticated
          try {
            const raw = localStorage.getItem("sta-profile");
            if (raw) {
              const p = JSON.parse(raw);
              setDisplayName(p.displayName || "Learner");
              setBio(p.bio || "");
              setTwitter(p.twitter || "");
              setGithub(p.github || "");
              setDiscord(p.discord || "");
              setAvatar(p.avatar || null);
            }
          } catch { /* ignore */ }
        } else {
          setDisplayName(data.displayName || "Learner");
          setBio(data.bio || "");
          setTwitter(data.socialLinks?.twitter || "");
          setGithub(data.socialLinks?.github || "");
          setDiscord(data.socialLinks?.discord || "");
          setAvatar(data.avatar || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) return; // 500KB limit
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          socialLinks: { twitter, github, discord },
        }),
      });

      if (res.ok) {
        // Also persist to localStorage as offline cache
        localStorage.setItem(
          "sta-profile",
          JSON.stringify({ displayName, bio, twitter, github, discord, avatar })
        );
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
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
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-st-green px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-st-green-dark disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saved ? t("profileSection.savedFeedback") : t("saveChanges")}
        </button>
      </div>
    </div>
  );
}
