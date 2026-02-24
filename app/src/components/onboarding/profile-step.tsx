"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, User, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProfileStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ProfileStep({ onNext, onBack }: ProfileStepProps) {
  const t = useTranslations("onboarding");
  const { profile, refreshProfile } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [twitter, setTwitter] = useState(profile?.socialLinks?.twitter ?? "");
  const [github, setGithub] = useState(profile?.socialLinks?.github ?? "");
  const [website, setWebsite] = useState(profile?.socialLinks?.website ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  const initials = (displayName || "L").slice(0, 2).toUpperCase();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      setAvatarUrl(data.avatarUrl);
      await refreshProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          username,
          bio,
          socialLinks: { twitter, github, website },
        }),
      });
      if (res.ok) {
        await refreshProfile();
      }
    } catch {
      // Non-blocking — proceed even if save fails
    } finally {
      setSaving(false);
      onNext();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center px-2"
    >
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold tracking-tight mb-1">
          {t("profileTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("profileSubtitle")}
        </p>
      </div>

      {/* Avatar with upload */}
      <div className="flex flex-col items-center mb-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingAvatar}
          className="relative cursor-pointer"
        >
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback className="text-lg">
              {initials || <User className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-sm">
            {uploadingAvatar ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleAvatarUpload}
          className="hidden"
        />
        <span className="mt-1.5 text-xs text-muted-foreground">
          {uploadingAvatar ? t("uploading") : t("changePhoto")}
        </span>
      </div>

      {/* Form fields — scrollable on small screens */}
      <div className="w-full max-w-sm space-y-3 mb-4 max-h-[50vh] overflow-y-auto pr-1">
        <div className="space-y-1.5">
          <Label htmlFor="onboarding-display-name" className="text-xs">{t("displayNameLabel")}</Label>
          <Input
            id="onboarding-display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("displayNamePlaceholder")}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="onboarding-username" className="text-xs">{t("usernameLabel")}</Label>
          <Input
            id="onboarding-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t("usernamePlaceholder")}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="onboarding-bio" className="text-xs">{t("bioLabel")}</Label>
          <Input
            id="onboarding-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t("bioPlaceholder")}
            className="h-9"
          />
        </div>

        <div className="pt-1 border-t">
          <p className="text-xs text-muted-foreground mb-2">{t("socialsLabel")}</p>
          <div className="space-y-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">𝕏</span>
              <Input
                id="onboarding-twitter"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder={t("twitterPlaceholder")}
                className="h-9 pl-8"
              />
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              <Input
                id="onboarding-github"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder={t("githubPlaceholder")}
                className="h-9 pl-8"
              />
            </div>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                id="onboarding-website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder={t("websitePlaceholder")}
                className="h-9 pl-8"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 w-full max-w-sm">
        <Button variant="outline" onClick={onBack} className="flex-1">
          {t("back")}
        </Button>
        <Button onClick={handleNext} disabled={saving} className="flex-1">
          {saving ? t("saving") : t("next")}
        </Button>
      </div>
    </motion.div>
  );
}
