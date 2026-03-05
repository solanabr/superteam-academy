"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Twitter,
  Download,
  Link2,
  Award,
  Loader2,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLocale } from "@/providers/locale-provider";
import { useAuth } from "@/providers/auth-provider";
import { credentialService } from "@/services";
import { getAllCourses } from "@/lib/sanity-fetch";
import type { Credential, CourseDetail } from "@/types";
import { events as analyticsEvents } from "@/lib/analytics";

/* -- Track -> Course slug mapping -- */
const trackToCourse: Record<string, string> = {
  "Solana Core": "solana-fundamentals",
  "Anchor Framework": "anchor-development",
  "Program Security": "program-security",
  DeFi: "defi-fundamentals",
  Testing: "solana-testing",
};

/* -- NFT Artwork (inline SVG per credential) -- */

function NftArt({
  accent,
  variant,
  className,
}: {
  accent: string;
  variant: number;
  className?: string;
}) {
  const hex = (cx: number, cy: number, r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(" ");

  return (
    <svg viewBox="0 0 240 240" className={className ?? "w-full aspect-square"}>
      <rect width="240" height="240" fill="#08080a" rx="12" />
      <defs>
        <radialGradient id={`gc${variant}`}>
          <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
          <stop offset="70%" stopColor={accent} stopOpacity="0.03" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="120" cy="120" r="100" fill={`url(#gc${variant})`} />

      {variant % 3 === 0 && (
        <>
          <polygon
            points={hex(120, 120, 80)}
            fill="none"
            stroke={accent}
            strokeOpacity="0.12"
            strokeWidth="1"
          />
          <polygon
            points={hex(120, 120, 56)}
            fill="none"
            stroke={accent}
            strokeOpacity="0.18"
            strokeWidth="1"
          />
          <polygon
            points={hex(120, 120, 32)}
            fill="none"
            stroke={accent}
            strokeOpacity="0.12"
            strokeWidth="0.5"
          />
          <polygon
            points="120,80 160,120 120,160 80,120"
            fill={accent}
            fillOpacity="0.08"
            stroke={accent}
            strokeOpacity="0.35"
            strokeWidth="1.5"
          />
          <polygon
            points="120,94 146,120 120,146 94,120"
            fill={accent}
            fillOpacity="0.12"
            stroke={accent}
            strokeOpacity="0.2"
            strokeWidth="1"
          />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (Math.PI / 3) * i - Math.PI / 2;
            return (
              <circle
                key={i}
                cx={120 + 80 * Math.cos(a)}
                cy={120 + 80 * Math.sin(a)}
                r="2"
                fill={accent}
                fillOpacity="0.3"
              />
            );
          })}
        </>
      )}

      {variant % 3 === 1 && (
        <>
          <circle
            cx="120"
            cy="120"
            r="75"
            fill="none"
            stroke={accent}
            strokeOpacity="0.1"
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
          <circle
            cx="120"
            cy="120"
            r="55"
            fill="none"
            stroke={accent}
            strokeOpacity="0.15"
            strokeWidth="1"
          />
          <circle
            cx="120"
            cy="120"
            r="35"
            fill="none"
            stroke={accent}
            strokeOpacity="0.1"
            strokeWidth="0.5"
          />
          <line
            x1="120"
            y1="88"
            x2="120"
            y2="152"
            stroke={accent}
            strokeOpacity="0.35"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="120"
            y1="88"
            x2="100"
            y2="108"
            stroke={accent}
            strokeOpacity="0.25"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="120"
            y1="88"
            x2="140"
            y2="108"
            stroke={accent}
            strokeOpacity="0.25"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M98 142 Q120 165 142 142"
            fill="none"
            stroke={accent}
            strokeOpacity="0.35"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle
            cx="120"
            cy="98"
            r="8"
            fill="none"
            stroke={accent}
            strokeOpacity="0.3"
            strokeWidth="2"
          />
          <line
            x1="45"
            y1="120"
            x2="75"
            y2="120"
            stroke={accent}
            strokeOpacity="0.06"
            strokeWidth="0.5"
          />
          <line
            x1="165"
            y1="120"
            x2="195"
            y2="120"
            stroke={accent}
            strokeOpacity="0.06"
            strokeWidth="0.5"
          />
        </>
      )}

      {variant % 3 === 2 && (
        <>
          {[60, 90, 150, 180].map((v) => (
            <line
              key={`h${v}`}
              x1="40"
              y1={v}
              x2="200"
              y2={v}
              stroke={accent}
              strokeOpacity="0.05"
              strokeWidth="0.5"
            />
          ))}
          {[60, 90, 150, 180].map((v) => (
            <line
              key={`v${v}`}
              x1={v}
              y1="40"
              x2={v}
              y2="200"
              stroke={accent}
              strokeOpacity="0.05"
              strokeWidth="0.5"
            />
          ))}
          <line
            x1="55"
            y1="55"
            x2="185"
            y2="185"
            stroke={accent}
            strokeOpacity="0.04"
            strokeWidth="0.5"
          />
          <line
            x1="185"
            y1="55"
            x2="55"
            y2="185"
            stroke={accent}
            strokeOpacity="0.04"
            strokeWidth="0.5"
          />
          <path
            d="M120 70 L165 95 L165 145 L120 170 L75 145 L75 95 Z"
            fill={accent}
            fillOpacity="0.06"
            stroke={accent}
            strokeOpacity="0.25"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M120 88 L150 105 L150 137 L120 154 L90 137 L90 105 Z"
            fill={accent}
            fillOpacity="0.1"
            stroke={accent}
            strokeOpacity="0.15"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <rect
            x="111"
            y="118"
            width="18"
            height="14"
            rx="2"
            fill={accent}
            fillOpacity="0.25"
          />
          <path
            d="M114 118 L114 112 Q114 105 120 105 Q126 105 126 112 L126 118"
            fill="none"
            stroke={accent}
            strokeOpacity="0.3"
            strokeWidth="1.5"
          />
          <circle cx="120" cy="125" r="2" fill={accent} fillOpacity="0.5" />
        </>
      )}

      <rect
        x="1"
        y="1"
        width="238"
        height="238"
        rx="11"
        fill="none"
        stroke={accent}
        strokeOpacity="0.12"
        strokeWidth="0.5"
      />
    </svg>
  );
}

/* -- Copy Button -- */

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const { t } = useLocale();

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="text-muted-foreground/60 hover:text-foreground transition-colors flex items-center gap-1"
    >
      {copied ? (
        <>
          <Check className="size-3 text-primary" />
          {label && (
            <span className="text-[10px] text-primary">
              {t("common.copied")}
            </span>
          )}
        </>
      ) : (
        <>
          <Copy className="size-3" />
          {label && <span className="text-[10px]">{label}</span>}
        </>
      )}
    </button>
  );
}

/* -- Page -- */

export default function CertificatePage() {
  const { id } = useParams<{ id: string }>();
  const { publicKey } = useWallet();
  const { user } = useAuth();
  const { t } = useLocale();

  const [credential, setCredential] = useState<Credential | null>(null);
  const [allCreds, setAllCreds] = useState<Credential[]>([]);
  const [courses, setCourses] = useState<CourseDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // Try fetching by mint address first (works for anyone viewing the link)
      const byMint = await credentialService.getCredentialByMint(id);
      if (byMint) {
        setCredential(byMint);
        analyticsEvents.credentialViewed(id);
      }

      // Also load all credentials for the connected wallet (for variant index)
      if (publicKey) {
        const wallet = publicKey.toBase58();
        const creds = await credentialService.getCredentials(wallet);
        setAllCreds(creds);
        // If mint lookup failed, try finding in wallet credentials
        if (!byMint) {
          const found = creds.find(
            (c) => c.id === id || c.mintAddress === id,
          );
          if (found) setCredential(found);
        }
      }

      const allCourses = await getAllCourses();
      setCourses(allCourses);
      setLoading(false);
    }
    load();
  }, [id, publicKey]);

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="pointer-events-none absolute inset-0 bg-mesh animate-drift-2" />
        <Loader2 className="size-6 animate-spin text-muted-foreground/40" />
      </div>
    );
  }

  if (!credential) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="pointer-events-none absolute inset-0 bg-mesh animate-drift-2" />
        <div className="relative z-10 text-center">
          <Award className="size-12 text-muted-foreground/60 mx-auto" />
          <h1 className="mt-4 text-xl font-semibold">
            {t("certificates.notFound")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground/60">
            {t("certificates.notFoundDescription")}
          </p>
          <Link
            href="/profile"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            {t("certificates.backToProfile")}
          </Link>
        </div>
      </div>
    );
  }

  const variant = allCreds.findIndex((c) => c.mintAddress === credential.mintAddress);
  const ownerAddress = publicKey?.toBase58() ?? "";
  const truncatedMint =
    credential.mintAddress.slice(0, 4) +
    "..." +
    credential.mintAddress.slice(-4);
  const truncatedOwner = ownerAddress
    ? ownerAddress.slice(0, 4) + "..." + ownerAddress.slice(-4)
    : "–";

  const courseSlug = trackToCourse[credential.track];
  const relatedCourse = courseSlug
    ? courses.find((c) => c.slug === courseSlug)
    : undefined;

  const shareText = `I earned the ${credential.track} (${credential.level}) credential on Superteam Academy! 🎓`;
  const username = user?.username ?? "learner";

  const details = [
    {
      label: t("certificates.mintAddress"),
      value: truncatedMint,
      full: credential.mintAddress,
      copyable: true,
    },
    ...(ownerAddress
      ? [
          {
            label: t("certificates.owner"),
            value: truncatedOwner,
            full: ownerAddress,
            copyable: true,
          },
        ]
      : []),
    {
      label: t("certificates.standard"),
      value: t("certificates.metaplexCore"),
    },
    { label: t("certificates.type"), value: t("certificates.soulbound") },
    {
      label: t("certificates.network"),
      value: "Solana Devnet",
    },
    ...(credential.coursesCompleted > 0
      ? [
          {
            label: t("certificates.coursesCompleted"),
            value: String(credential.coursesCompleted),
          },
        ]
      : []),
    ...(credential.totalXp > 0
      ? [
          {
            label: t("certificates.totalXp"),
            value: `${credential.totalXp.toLocaleString()} XP`,
          },
        ]
      : []),
  ];

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-mesh animate-drift-2" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 pt-28 pb-20">
        {/* Back */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/70 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          {t("certificates.backToProfile")}
        </Link>

        {/* NFT Artwork */}
        <div className="mt-8 max-w-sm mx-auto">
          <NftArt
            accent={credential.accent}
            variant={variant >= 0 ? variant : 0}
            className="cert-artwork w-full aspect-square rounded-xl"
          />
        </div>

        {/* Title & Meta */}
        <div className="mt-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {credential.track}
          </h1>
          <div className="mt-2 flex items-center justify-center gap-2 text-sm">
            <span style={{ color: credential.accent }} className="font-medium">
              {credential.level}
            </span>
            <span className="text-muted-foreground/50">·</span>
            <span className="text-muted-foreground/60">
              {t("certificates.earnedAt", { date: credential.earnedAt })}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground/60">
            {t("certificates.issuedTo", { username })}
          </p>
        </div>

        {/* Share Buttons */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-border/40 px-3 py-2 text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            <Twitter className="size-3.5" />
            {t("common.share")}
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-border/40 px-3 py-2 text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            <Link2 className="size-3.5" />
            {t("common.copyLink")}
          </button>
          <button
            onClick={() => {
              const svg = document.querySelector<SVGSVGElement>(".cert-artwork");
              if (!svg) return;
              const svgData = new XMLSerializer().serializeToString(svg);
              const canvas = document.createElement("canvas");
              canvas.width = 960;
              canvas.height = 960;
              const ctx = canvas.getContext("2d");
              if (!ctx) return;
              const img = new Image();
              img.onload = () => {
                ctx.drawImage(img, 0, 0, 960, 960);
                const a = document.createElement("a");
                a.download = `${credential.track.replace(/\s+/g, "-").toLowerCase()}-credential.png`;
                a.href = canvas.toDataURL("image/png");
                a.click();
              };
              img.src = "data:image/svg+xml;base64," + btoa(
                Array.from(new TextEncoder().encode(svgData), (b) => String.fromCharCode(b)).join("")
              );
            }}
            className="flex items-center gap-1.5 rounded-lg border border-border/40 px-3 py-2 text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            <Download className="size-3.5" />
            {t("common.download")}
          </button>
        </div>

        {/* On-Chain Details */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold">
            {t("certificates.onChainDetails")}
          </h2>
          <div className="mt-3 rounded-xl border border-border/30 divide-y divide-border/15">
            {details.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-xs text-muted-foreground/60">
                  {row.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono">{row.value}</span>
                  {"copyable" in row && row.copyable && "full" in row && row.full && (
                    <CopyButton text={row.full} />
                  )}
                </div>
              </div>
            ))}
            <div className="px-4 py-3">
              <a
                href={`https://explorer.solana.com/address/${credential.mintAddress}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="size-3" />
                {t("certificates.viewOnExplorer")}
              </a>
            </div>
          </div>
        </div>

        {/* Metadata URI */}
        {credential.metadataUri && (
          <div className="mt-4">
            <a
              href={credential.metadataUri}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-3" />
              {t("certificates.viewMetadata")}
            </a>
          </div>
        )}

        {/* Related Course */}
        {relatedCourse && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold">
              {t("certificates.relatedCourse")}
            </h2>
            <Link
              href={`/courses/${relatedCourse.slug}`}
              className="mt-3 flex items-center gap-3 rounded-xl border border-border/30 p-4 hover:border-border/50 transition-colors"
            >
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: `${relatedCourse.accent}10`,
                  color: relatedCourse.accent,
                }}
              >
                <relatedCourse.icon className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{relatedCourse.title}</p>
                <p className="text-[11px] text-muted-foreground/60">
                  {relatedCourse.lessons} lessons ·{" "}
                  {relatedCourse.xp.toLocaleString()} XP
                </p>
              </div>
              <ExternalLink className="size-4 text-muted-foreground/50 shrink-0" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
