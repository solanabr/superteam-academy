"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { UserIdentity } from "@supabase/supabase-js";
import { ProfileTab } from "./_components/profile-tab";
import { AccountTab } from "./_components/account-tab";
import { PrivacyTab } from "./_components/privacy-tab";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// ── Shared data shape returned by fetchProfile ────────────────────
interface ProfileData {
  username: string;
  bio: string;
  twitter: string;
  github: string;
  discord: string;
  nameRerollsUsed: number;
}

const VALID_TABS = ["profile", "account", "privacy"] as const;

export default function SettingsPage() {
  const t = useTranslations("settings");
  const [activeTab, setActiveTab] = useState("profile");

  // ── Shared state (used by multiple tabs) ────────────────────────
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Switch to the requested tab only after data has loaded, so AccountTab
  // mounts with fully-populated props instead of empty initial state.
  useEffect(() => {
    if (isLoadingProfile) return;
    const param = new URLSearchParams(window.location.search).get("tab");
    if (param && VALID_TABS.includes(param as (typeof VALID_TABS)[number])) {
      setActiveTab(param);
    }
  }, [isLoadingProfile]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);

  // ── Profile data (passed to ProfileTab as initial values) ───────
  const [profileData, setProfileData] = useState<ProfileData>({
    username: "",
    bio: "",
    twitter: "",
    github: "",
    discord: "",
    nameRerollsUsed: 0,
  });

  // ── Account data (passed to AccountTab as initial values) ───────
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [googleIdentity, setGoogleIdentity] = useState<UserIdentity | null>(
    null
  );
  const [gitHubEmail, setGitHubEmail] = useState<string | null>(null);
  const [gitHubIdentity, setGitHubIdentity] = useState<UserIdentity | null>(
    null
  );

  // ── Fetch profile + identities ──────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoadingProfile(false);
        return;
      }

      // Profile data — query core fields first, name_rerolls_used separately
      // to avoid breaking the entire query if the column hasn't been migrated yet
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(
          "username, bio, social_links, is_public, wallet_address, google_id, avatar_url"
        )
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("[settings] profile fetch error:", profileError.message);
      }

      let nameRerollsUsed = 0;

      if (profile) {
        const socialLinks = (profile.social_links ?? {}) as {
          twitter?: string;
          github?: string;
          discord?: string;
        };

        setIsPublic(profile.is_public ?? true);
        setAvatarUrl(profile.avatar_url ?? null);
        setWalletAddress(profile.wallet_address ?? null);

        // Fetch name_rerolls_used separately — column may not exist yet
        const { data: rerollData } = await supabase
          .from("profiles")
          .select("name_rerolls_used")
          .eq("id", user.id)
          .single();

        if (rerollData && "name_rerolls_used" in rerollData) {
          nameRerollsUsed =
            (rerollData as { name_rerolls_used: number }).name_rerolls_used ??
            0;
        }

        setProfileData({
          username: profile.username ?? "",
          bio: profile.bio ?? "",
          twitter: socialLinks.twitter ?? "",
          github: socialLinks.github ?? "",
          discord: socialLinks.discord ?? "",
          nameRerollsUsed,
        });
      }

      // OAuth identities from auth identities
      const gIdentity = user.identities?.find((id) => id.provider === "google");
      if (gIdentity) {
        setGoogleIdentity(gIdentity);
        setGoogleEmail((gIdentity.identity_data?.email as string) ?? null);
      }

      const ghIdentity = user.identities?.find(
        (id) => id.provider === "github"
      );
      if (ghIdentity) {
        setGitHubIdentity(ghIdentity);
        setGitHubEmail((ghIdentity.identity_data?.email as string) ?? null);
      }
    } catch {
      // Keep defaults on error
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ── Shared avatar callback (profile + account both can change it) ─
  const handleAvatarChange = useCallback((url: string | null) => {
    setAvatarUrl(url);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-black tracking-[-0.5px] sm:text-3xl">
          {t("title")}
        </h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="w-full overflow-x-auto sm:w-auto">
          <TabsTrigger value="profile">{t("profileSettings")}</TabsTrigger>
          <TabsTrigger value="account">{t("accountSettings")}</TabsTrigger>
          <TabsTrigger value="privacy">{t("privacy")}</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          {isLoadingProfile ? (
            <Card>
              <CardContent className="space-y-6 p-6">
                <div className="flex items-center justify-center py-8">
                  <div className="sol-spinner" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <ProfileTab
              initialData={profileData}
              avatarUrl={avatarUrl}
              isPublic={isPublic}
              onAvatarChange={handleAvatarChange}
            />
          )}
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <AccountTab
            initialWalletAddress={walletAddress}
            initialGoogleEmail={googleEmail}
            initialGoogleIdentity={googleIdentity}
            initialGitHubEmail={gitHubEmail}
            initialGitHubIdentity={gitHubIdentity}
            avatarUrl={avatarUrl}
            onAvatarChange={handleAvatarChange}
          />
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy">
          <PrivacyTab isPublic={isPublic} onPublicChange={setIsPublic} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
