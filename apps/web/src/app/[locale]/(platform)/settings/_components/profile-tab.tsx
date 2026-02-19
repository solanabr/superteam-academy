"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { Shuffle } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { generateWalletName } from "@/lib/utils/generate-wallet-name";

// ── Types ─────────────────────────────────────────────────────────
interface ProfileData {
  username: string;
  bio: string;
  twitter: string;
  github: string;
  discord: string;
  nameRerollsUsed: number;
}

interface ProfileTabProps {
  initialData: ProfileData;
  avatarUrl: string | null;
  isPublic: boolean;
  onAvatarChange: (url: string | null) => void;
}

// ── Constants ─────────────────────────────────────────────────────
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 1 * 1024 * 1024; // 1 MB
const MAX_REROLLS = 3;

export function ProfileTab({
  initialData,
  avatarUrl,
  isPublic,
  onAvatarChange,
}: ProfileTabProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const tName = useTranslations("nameGenerator");

  // ── Local form state ──────────────────────────────────────────
  const [username, setUsername] = useState(initialData.username);
  const [bio, setBio] = useState(initialData.bio);
  const [twitter, setTwitter] = useState(initialData.twitter);
  const [github, setGithub] = useState(initialData.github);
  const [discord, setDiscord] = useState(initialData.discord);
  const [nameRerollsUsed, setNameRerollsUsed] = useState(
    initialData.nameRerollsUsed
  );

  // ── UI state ──────────────────────────────────────────────────
  const [isRerollingName, setIsRerollingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── Avatar upload ─────────────────────────────────────────────
  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setSaveMessage({ type: "error", text: t("avatarInvalidType") });
      return;
    }
    if (file.size > MAX_SIZE) {
      setSaveMessage({ type: "error", text: t("avatarTooLarge") });
      return;
    }

    setIsUploadingAvatar(true);
    setSaveMessage(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        setSaveMessage({ type: "error", text: uploadError.message });
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      // Store the stable public URL in the DB; use a cache-busted URL only for
      // immediate UI display so the browser doesn't serve the stale cached image.
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) {
        setSaveMessage({ type: "error", text: tCommon("error") });
        return;
      }

      onAvatarChange(`${publicUrl}?t=${Date.now()}`);
      setSaveMessage({ type: "success", text: t("avatarUpdated") });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage({ type: "error", text: tCommon("error") });
    } finally {
      setIsUploadingAvatar(false);
      // Reset input so re-selecting the same file triggers onChange
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    setSaveMessage(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // If the current avatar is a Supabase Storage upload, delete the file too.
      // Google URLs (lh3.googleusercontent.com) have nothing to delete in storage.
      if (avatarUrl?.includes("/storage/v1/object/public/avatars/")) {
        const marker = "/storage/v1/object/public/avatars/";
        const storagePath = avatarUrl
          .slice(avatarUrl.indexOf(marker) + marker.length)
          .split("?")[0];
        await supabase.storage.from("avatars").remove([storagePath]);
      }

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);

      if (error) {
        setSaveMessage({ type: "error", text: tCommon("error") });
        return;
      }

      onAvatarChange(null);
      setSaveMessage({ type: "success", text: t("avatarRemoved") });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage({ type: "error", text: tCommon("error") });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ── Name re-roll ──────────────────────────────────────────────
  const handleNameReroll = async () => {
    if (isRerollingName || nameRerollsUsed >= MAX_REROLLS) return;
    setIsRerollingName(true);
    setSaveMessage(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const newName = generateWalletName();
      const newCount = nameRerollsUsed + 1;

      const { error } = await supabase
        .from("profiles")
        .update({ username: newName, name_rerolls_used: newCount })
        .eq("id", user.id);

      if (error) {
        setSaveMessage({ type: "error", text: tCommon("error") });
      } else {
        setUsername(newName);
        setNameRerollsUsed(newCount);
      }
    } catch {
      setSaveMessage({ type: "error", text: tCommon("error") });
    } finally {
      setIsRerollingName(false);
    }
  };

  // ── Profile save ──────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSaveMessage({ type: "error", text: tCommon("error") });
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          username,
          bio,
          social_links: { twitter, github, discord },
          is_public: isPublic,
        })
        .eq("id", user.id);

      if (error) {
        setSaveMessage({ type: "error", text: tCommon("error") });
      } else {
        setSaveMessage({ type: "success", text: t("saved") });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch {
      setSaveMessage({ type: "error", text: tCommon("error") });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl ?? undefined} alt={username} />
              <AvatarFallback className="text-2xl">
                {username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isUploadingAvatar && (
              <div className="bg-bg/60 absolute inset-0 flex items-center justify-center rounded-full">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("avatar")}</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? t("uploadingAvatar") : t("changeAvatar")}
              </Button>
              {avatarUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingAvatar}
                >
                  {t("removeAvatar")}
                </Button>
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
              aria-label={t("changeAvatar")}
            />
          </div>
        </div>

        {/* Display Name + Re-roll */}
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="username">
            {t("displayName")}
          </label>
          <div className="flex items-center gap-3">
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={30}
              className="h-10 w-full flex-1 rounded-md border border-border bg-bg px-3 font-mono text-sm ring-offset-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {nameRerollsUsed < MAX_REROLLS && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNameReroll}
                disabled={isRerollingName}
                className="shrink-0 gap-1.5"
              >
                {isRerollingName ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Shuffle size={16} weight="bold" aria-hidden="true" />
                )}
                {tName("nameReroll")}
                <span className="text-xs text-text-3">
                  ({MAX_REROLLS - nameRerollsUsed})
                </span>
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="bio">
            {t("bio")}
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm ring-offset-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="twitter">
              {t("twitter")}
            </label>
            <input
              id="twitter"
              type="text"
              placeholder={t("twitterPlaceholder")}
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm ring-offset-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="github">
              {t("github")}
            </label>
            <input
              id="github"
              type="text"
              placeholder={t("githubPlaceholder")}
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm ring-offset-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="discord">
              {t("discord")}
            </label>
            <input
              id="discord"
              type="text"
              placeholder={t("discordPlaceholder")}
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm ring-offset-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="push" onClick={handleSave} disabled={isSaving}>
            {isSaving && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {tCommon("save")}
          </Button>
          {saveMessage && (
            <p
              className={`text-sm ${
                saveMessage.type === "success" ? "text-success" : "text-danger"
              }`}
            >
              {saveMessage.text}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
