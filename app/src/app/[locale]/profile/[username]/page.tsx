"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  ExternalLink,
  Loader2,
  Calendar,
  UserX,
  Github,
  Globe,
  MessageCircle,
  Twitter,
} from "lucide-react";
import { deriveLevel } from "@/types";
import type { Achievement, Credential } from "@/types";

interface PublicProfile {
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  joinedAt: string;
  socialLinks: {
    twitter: string | null;
    github: string | null;
    discord: string | null;
    website: string | null;
  };
  xp: number;
  achievements: Achievement[];
  credentials: Credential[];
}

export default function PublicProfilePage() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const params = useParams<{ username: string }>();
  const username = params.username;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch(`/api/profile/${encodeURIComponent(username)}`);
        if (response.status === 404) {
          setNotFound(true);
          return;
        }
        if (response.ok) {
          const data = (await response.json()) as PublicProfile;
          setProfile(data);
        }
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }
    void fetchProfile();
  }, [username]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <UserX className="mb-4 h-16 w-16 text-muted-foreground/30" />
        <h1 className="text-2xl font-bold">{t("notFoundTitle")}</h1>
        <p className="mt-2 text-muted-foreground">
          {t("notFoundDescription")}
        </p>
      </div>
    );
  }

  const name = profile.displayName ?? profile.username;
  const level = deriveLevel(profile.xp);
  const unlockedAchievements = profile.achievements.filter((a) => a.unlockedAt !== null);
  const socialLinks = [
    profile.socialLinks.twitter
      ? {
          href: `https://x.com/${profile.socialLinks.twitter.replace(/^@/, "")}`,
          label: "X / Twitter",
          icon: Twitter,
          value: profile.socialLinks.twitter,
        }
      : null,
    profile.socialLinks.github
      ? {
          href: `https://github.com/${profile.socialLinks.github.replace(/^@/, "")}`,
          label: "GitHub",
          icon: Github,
          value: profile.socialLinks.github,
        }
      : null,
    profile.socialLinks.discord
      ? {
          href: `https://discord.com/users/${profile.socialLinks.discord}`,
          label: "Discord",
          icon: MessageCircle,
          value: profile.socialLinks.discord,
        }
      : null,
    profile.socialLinks.website
      ? {
          href: profile.socialLinks.website,
          label: "Website",
          icon: Globe,
          value: profile.socialLinks.website,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="container py-8 md:py-12">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profile.avatarUrl ?? undefined} alt={name} />
          <AvatarFallback className="text-xl">{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col items-center gap-2 sm:flex-row">
            <h1 className="text-2xl font-bold">{name}</h1>
            <Badge variant="outline">{tc("level")} {level}</Badge>
          </div>
          {profile.bio && <p className="mt-2 text-muted-foreground">{profile.bio}</p>}
          <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {t("joined", { date: new Date(profile.joinedAt).toLocaleDateString() })}
          </p>
          {socialLinks.length > 0 ? (
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <link.icon className="h-3.5 w-3.5" />
                  <span>{link.value}</span>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{profile.xp.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{tc("xp")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{level}</p>
            <p className="text-xs text-muted-foreground">{tc("level")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{unlockedAchievements.length}</p>
            <p className="text-xs text-muted-foreground">{t("badges")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">{t("badges")}</h2>
        {unlockedAchievements.length === 0 ? (
          <p className="text-muted-foreground">{t("noBadges")}</p>
        ) : (
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-12">
            {unlockedAchievements.map((ach) => (
              <div
                key={ach.id}
                className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 text-xl"
                title={`${ach.name}: ${ach.description}`}
              >
                {ach.icon}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Credentials */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">{t("credentials")}</h2>
        {profile.credentials.length === 0 ? (
          <p className="text-muted-foreground">{t("noCredentials")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.credentials.map((cred) => (
              <Card key={cred.mintAddress}>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">{cred.trackName}</h3>
                  </div>
                  <Badge variant="outline" className="mb-2">
                    {t("credentialLevel", { level: cred.level })}
                  </Badge>
                  <a
                    href={cred.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    {t("verifyOnChain")} <ExternalLink className="h-3 w-3" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
