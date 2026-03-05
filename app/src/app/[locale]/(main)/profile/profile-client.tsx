"use client";

import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, BookOpen, Eye, EyeOff, Radar, Shield } from "lucide-react";
import { SocialIcon } from "@/components/social-icons";
import type { SocialPlatform } from "@/components/social-icons";
import { useState, useEffect } from "react";

const PROFILE_NAME_KEY = "st-academy:profile-name";
const PROFILE_AVATAR_KEY = "st-academy:profile-avatar";
const PROFILE_BIO_KEY = "st-academy:profile-bio";
const PROFILE_VISIBILITY_KEY = "st-academy:profile-visibility";
const ACCOUNT_OPENED_KEY = "st-academy:account-opened";

const SOCIAL_KEYS: {
  platform: SocialPlatform;
  key: string;
  placeholder: string;
}[] = [
  { platform: "x", key: "st-academy:social:x", placeholder: "X (Twitter)" },
  {
    platform: "linkedin",
    key: "st-academy:social:linkedin",
    placeholder: "LinkedIn",
  },
  {
    platform: "telegram",
    key: "st-academy:social:telegram",
    placeholder: "Telegram",
  },
  {
    platform: "discord",
    key: "st-academy:social:discord",
    placeholder: "Discord",
  },
  {
    platform: "github",
    key: "st-academy:social:github",
    placeholder: "GitHub",
  },
];

const SKILL_DATA: { key: string; level: number }[] = [
  { key: "rust", level: 70 },
  { key: "anchor", level: 45 },
  { key: "frontend", level: 80 },
  { key: "security", level: 30 },
  { key: "defi", level: 50 },
  { key: "testing", level: 60 },
];

export function ProfileClient() {
  const { publicKey } = useAuth();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const [profileName, setProfileName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState<string>("");
  const [accountDate, setAccountDate] = useState<string>("");
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setProfileName(localStorage.getItem(PROFILE_NAME_KEY) || null);
    setAvatarUrl(localStorage.getItem(PROFILE_AVATAR_KEY));
    setBio(localStorage.getItem(PROFILE_BIO_KEY) || "");

    // Account opening date
    let opened = localStorage.getItem(ACCOUNT_OPENED_KEY);
    if (!opened) {
      opened = new Date().toISOString();
      localStorage.setItem(ACCOUNT_OPENED_KEY, opened);
    }
    try {
      const d = new Date(opened);
      setAccountDate(
        d.toLocaleDateString("default", { month: "long", year: "numeric" }),
      );
    } catch {
      /* ignore */
    }

    // Social links
    const links: Record<string, string> = {};
    for (const s of SOCIAL_KEYS) {
      links[s.platform] = localStorage.getItem(s.key) || "";
    }
    setSocialLinks(links);

    const stored = localStorage.getItem(PROFILE_VISIBILITY_KEY);
    if (stored === "public" || stored === "private") {
      setVisibility(stored);
    }
  }, []);

  useEffect(() => {
    const onProfileChange = () => {
      setProfileName(localStorage.getItem(PROFILE_NAME_KEY) || null);
      setAvatarUrl(localStorage.getItem(PROFILE_AVATAR_KEY));
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

  const handleVisibilityChange = (value: "public" | "private") => {
    setVisibility(value);
    localStorage.setItem(PROFILE_VISIBILITY_KEY, value);
  };

  const displayName = publicKey
    ? ((profileName?.trim() || null) ??
      `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`)
    : t("anonymous");

  return (
    <>
      <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-primary bg-muted">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold text-[hsl(var(--brand-logo-green))] drop-shadow-md">
            {displayName}
          </h1>
          {accountDate && (
            <p className="text-muted-foreground">
              {t("joinDate")} {accountDate}
            </p>
          )}
          {bio && <p className="mt-2 text-sm text-muted-foreground">{bio}</p>}
          {/* Social icons */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {SOCIAL_KEYS.map((s) => {
              const url = socialLinks[s.platform];
              const hasUrl = !!url;
              const icon = (
                <div
                  key={s.platform}
                  className={`flex h-9 w-9 items-center justify-center rounded-full bg-muted transition-colors ${
                    hasUrl
                      ? "text-foreground hover:bg-primary/10"
                      : "text-muted-foreground/30"
                  }`}
                  title={s.placeholder}
                >
                  <SocialIcon platform={s.platform} className="h-5 w-5" />
                </div>
              );
              if (hasUrl) {
                return (
                  <a
                    key={s.platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.placeholder}
                  >
                    {icon}
                  </a>
                );
              }
              return icon;
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              asChild
              size="sm"
              className="bg-[hsl(var(--brand-logo-green))] text-white hover:bg-[hsl(var(--brand-logo-green-hover))] hover:text-white transition-transform active:scale-[0.98]"
            >
              <Link
                href="/settings"
                className="focus-visible:outline-none text-white"
              >
                {t("editProfile")}
              </Link>
            </Button>
            <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
              <button
                type="button"
                onClick={() => handleVisibilityChange("public")}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                  visibility === "public"
                    ? "bg-[hsl(var(--brand-logo-green))] text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="h-3 w-3" />
                {t("public")}
              </button>
              <button
                type="button"
                onClick={() => handleVisibilityChange("private")}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                  visibility === "private"
                    ? "bg-[hsl(var(--brand-logo-green))] text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <EyeOff className="h-3 w-3" />
                {t("private")}
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {visibility === "public"
              ? t("profilePublicDesc")
              : t("profilePrivateDesc")}
          </p>
        </div>
      </div>

      <section className="mb-8">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--brand-logo-green))]">
              <Radar className="h-5 w-5" />
              {t("skillRadarTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {SKILL_DATA.map((skill) => (
                <div key={skill.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{t(skill.key)}</span>
                    <span className="text-muted-foreground">
                      {skill.level}%
                    </span>
                  </div>
                  <div className="skill-radar-track h-2.5 w-full overflow-hidden rounded-full bg-sky-500/20">
                    <div
                      className="skill-radar-bar h-full rounded-full bg-sky-500 transition-all duration-500"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mb-8">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--brand-logo-green))]">
              <Shield className="h-5 w-5" />
              {t("credentials")}
            </CardTitle>
            <CardDescription>{t("credentialsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("noCredentialsYet")}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mb-8">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--brand-logo-green))]">
              <Award className="h-5 w-5" />
              {t("achievements")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-primary/20 px-3 py-1 text-sm font-medium text-primary">
                {t("firstSteps")}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--brand-logo-green))]">
              <BookOpen className="h-5 w-5" />
              {t("completedCourses")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t("noCoursesYet")}</p>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
