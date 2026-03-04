"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Github, Globe, Twitter } from "lucide-react";
import { useTranslations } from "next-intl";
import { getPublicProfileByUsername, type PublicProfileSnapshot } from "@/services/PublicProfileService";

function AvatarInitials({ wallet, name }: { wallet: string; name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const hue = wallet
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <div
      aria-label={name}
      style={{
        width: 84,
        height: 84,
        borderRadius: "50%",
        background: `hsl(${hue},60%,35%)`,
        border: "3px solid rgba(153,69,255,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 28,
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0,
      }}
    >
      {initials || wallet.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function PublicProfilePage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const username = String(params?.username ?? "");
  const t = useTranslations("ProfilePublic");
  const [profile, setProfile] = useState<PublicProfileSnapshot | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProfile(getPublicProfileByUsername(username));
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [username]);

  const walletShort = profile?.wallet
    ? `${profile.wallet.slice(0, 6)}…${profile.wallet.slice(-6)}`
    : "";

  if (!loaded) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
          <p style={{ color: "var(--text-muted)" }}>{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
          <h1 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            {t("notFound.title")}
          </h1>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            {t("notFound.description")}
          </p>
          <Link href={`/${locale}/courses`} prefetch={false} className="underline" style={{ color: "var(--text-purple)" }}>
            {t("notFound.cta")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="rounded-2xl p-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex items-start gap-4">
          <AvatarInitials wallet={profile.wallet} name={profile.displayName} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
              {profile.displayName}
            </h1>
            <p className="text-xs font-mono mt-1" style={{ color: "var(--text-muted)" }} title={profile.wallet}>
              {walletShort}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              @{profile.username}
            </p>
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm mt-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {profile.bio}
          </p>
        )}

        <div className="flex items-center gap-3 mt-4 flex-wrap">
          {profile.twitter && (
            <a
              href={`https://twitter.com/${profile.twitter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              <Twitter size={12} aria-hidden="true" />@{profile.twitter}
            </a>
          )}
          {profile.github && (
            <a
              href={`https://github.com/${profile.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              <Github size={12} aria-hidden="true" />
              {profile.github}
            </a>
          )}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              <Globe size={12} aria-hidden="true" />
              {profile.website}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
