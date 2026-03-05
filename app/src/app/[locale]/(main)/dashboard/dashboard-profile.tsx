"use client";

import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { SocialIcon, getSocialPlatform } from "@/components/social-icons";
import { useState, useEffect } from "react";

const PROFILE_NAME_KEY = "st-academy:profile-name";
const PROFILE_AVATAR_KEY = "st-academy:profile-avatar";
const PROFILE_BIO_KEY = "st-academy:profile-bio";
const ACCOUNT_OPENED_KEY = "st-academy:account-opened";

type SocialLink = { label: string; url: string };

/** Stub: em produção viria do perfil do usuário (settings/on-chain) */
const stubSocialLinks: SocialLink[] = [];

function getAccountOpenedLabel(): string {
  try {
    let stored = localStorage.getItem(ACCOUNT_OPENED_KEY);
    if (!stored) {
      stored = new Date().toISOString();
      localStorage.setItem(ACCOUNT_OPENED_KEY, stored);
    }
    const d = new Date(stored);
    return d.toLocaleDateString("default", { month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

export function DashboardProfile() {
  const { publicKey } = useAuth();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const [profileName, setProfileName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [accountDate, setAccountDate] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setProfileName(localStorage.getItem(PROFILE_NAME_KEY) || null);
    setAvatarUrl(localStorage.getItem(PROFILE_AVATAR_KEY));
    setBio(localStorage.getItem(PROFILE_BIO_KEY));
    setAccountDate(getAccountOpenedLabel());
  }, []);

  useEffect(() => {
    const onProfileChange = () => {
      setProfileName(localStorage.getItem(PROFILE_NAME_KEY) || null);
      setAvatarUrl(localStorage.getItem(PROFILE_AVATAR_KEY));
      setBio(localStorage.getItem(PROFILE_BIO_KEY));
    };
    window.addEventListener("profile-avatar-change", onProfileChange);
    window.addEventListener("profile-name-change", onProfileChange);
    window.addEventListener("profile-bio-change", onProfileChange);
    return () => {
      window.removeEventListener("profile-avatar-change", onProfileChange);
      window.removeEventListener("profile-name-change", onProfileChange);
      window.removeEventListener("profile-bio-change", onProfileChange);
    };
  }, []);

  if (!publicKey) {
    return (
      <div className="mb-10 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
        <p className="text-muted-foreground">
          {tCommon("signIn")} para ver seu perfil e progresso.
        </p>
      </div>
    );
  }

  const displayName =
    (profileName?.trim() || null) ??
    `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`;
  const initial = (
    profileName?.trim().charAt(0) || displayName.charAt(0)
  ).toUpperCase();
  const bioText = bio?.trim() || t("bioPlaceholder");

  return (
    <div className="mb-10 flex flex-col gap-8 md:flex-row md:items-start">
      <div className="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-primary bg-muted text-3xl font-bold text-muted-foreground md:h-48 md:w-48">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="text-3xl font-bold drop-shadow-md">{displayName}</h1>
        {accountDate && (
          <p className="mt-1 text-muted-foreground">
            {t("joinDate")} {accountDate}
          </p>
        )}
        <p className="mt-4 text-muted-foreground">{bioText}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button
            asChild
            size="sm"
            className="btn-theme-action gap-2 transition-transform active:scale-[0.98]"
          >
            <Link href="/settings">{t("editProfile")}</Link>
          </Button>
          {stubSocialLinks.map((link) => {
            const platform = getSocialPlatform(link.label, link.url);
            return (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                title={link.label}
                className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md p-1"
              >
                {platform ? (
                  <SocialIcon platform={platform} className="h-5 w-5" />
                ) : (
                  link.label
                )}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
