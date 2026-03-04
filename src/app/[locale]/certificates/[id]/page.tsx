"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Award,
  ExternalLink,
  Share2,
  Copy,
  Check,
  ChevronLeft,
  Zap,
  Twitter,
  Download,
} from "lucide-react";
import { useCredentials } from "@/hooks/useCredentials";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";

export default function CertificatePage() {
  const t = useTranslations("CertificateView");
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const id = params?.id as string;
  const { publicKey } = useWallet();
  const { data: credentials, isLoading } = useCredentials();
  const [copied, setCopied] = useState(false);

  const credential = credentials?.find((c) => c.id === id);
  const courseAttr = credential?.attributes?.find(
    (a) => a.trait_type === "course" || a.trait_type === "track",
  );
  const courseName = courseAttr?.value ?? id;

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function shareTwitter() {
    const text = encodeURIComponent(t("share.twitterText", { courseName }));
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/${locale}/profile`}
        className="inline-flex items-center gap-1.5 text-sm mb-8 transition-colors duration-150"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.color =
            "var(--text-secondary)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")
        }
      >
        <ChevronLeft size={16} aria-hidden="true" />
        {t("actions.backToProfile")}
      </Link>

      {isLoading ? (
        <div
          className="h-80 rounded-2xl animate-pulse"
          style={{ background: "var(--bg-surface)" }}
          aria-label={t("status.loadingAria")}
        />
      ) : !credential ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <Award
            size={40}
            className="mx-auto mb-4"
            style={{ color: "var(--text-muted)" }}
            aria-hidden="true"
          />
          <p
            className="font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            {t("status.notFoundTitle")}
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("status.notFoundBody")}
          </p>
        </div>
      ) : (
        <>
          <div
            className="rounded-2xl overflow-hidden mb-6"
            style={{
              background:
                "linear-gradient(135deg, rgba(153,69,255,0.12) 0%, rgba(25,251,155,0.06) 100%)",
              border: "1px solid rgba(153,69,255,0.3)",
              boxShadow:
                "0 0 60px rgba(153,69,255,0.12), 0 0 0 1px rgba(153,69,255,0.2)",
            }}
          >
            <div
              className="relative flex items-center justify-center"
              style={{ minHeight: "280px", background: "rgba(0,0,0,0.2)" }}
            >
              {credential.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={credential.image}
                  alt={credential.name}
                  className="w-full h-full object-cover"
                  style={{ maxHeight: "320px" }}
                />
              ) : (
                <div className="flex flex-col items-center gap-4 py-16 px-8">
                  <svg
                    width="96"
                    height="96"
                    viewBox="0 0 96 96"
                    fill="none"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient
                        id="cert-grad"
                        x1="0"
                        y1="0"
                        x2="96"
                        y2="96"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#9945FF" />
                        <stop offset="0.5" stopColor="#43b4ca" />
                        <stop offset="1" stopColor="#19FB9B" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      stroke="url(#cert-grad)"
                      strokeWidth="2"
                      fill="rgba(153,69,255,0.08)"
                    />
                    <path
                      d="M48 24L54.18 37.64L69 39.27L58.5 49.49L61.18 64L48 56.64L34.82 64L37.5 49.49L27 39.27L41.82 37.64L48 24Z"
                      fill="url(#cert-grad)"
                    />
                  </svg>
                  <p
                    className="text-lg font-bold text-center"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {credential.name}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6">
              <h1
                className="text-2xl font-bold mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                {credential.name}
              </h1>
              {courseName && (
                <p
                  className="text-sm mb-4"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {t("status.awardedFor")}{" "}
                  <span style={{ color: "var(--text-purple)" }}>
                    {courseName}
                  </span>
                </p>
              )}

              {credential.attributes.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {credential.attributes.map((attr) => (
                    <div
                      key={attr.trait_type}
                      className="rounded-lg px-3 py-2"
                      style={{
                        background: "rgba(0,0,0,0.2)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <p
                        className="text-xs uppercase tracking-wider mb-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {attr.trait_type}
                      </p>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {attr.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {publicKey && (
                <div
                  className="flex items-center gap-2 mb-6 p-3 rounded-lg"
                  style={{
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <Zap
                    size={14}
                    style={{ color: "var(--text-purple)" }}
                    aria-hidden="true"
                  />
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {t("status.holderLabel")}{" "}
                    <span
                      className="font-mono"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {publicKey.toBase58().slice(0, 8)}...
                      {publicKey.toBase58().slice(-8)}
                    </span>
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2.5">
                {!credential.isStub && (
                  <a
                    href={credential.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                    style={{
                      background: "rgba(153,69,255,0.15)",
                      border: "1px solid rgba(153,69,255,0.3)",
                      color: "var(--text-purple)",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "rgba(153,69,255,0.25)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "rgba(153,69,255,0.15)")
                    }
                  >
                    <ExternalLink size={14} aria-hidden="true" />
                    {t("actions.explorer")}
                  </a>
                )}
                <button
                  onClick={shareTwitter}
                  className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                  style={{
                    background: "rgba(29,155,240,0.12)",
                    border: "1px solid rgba(29,155,240,0.3)",
                    color: "#1d9bf0",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "rgba(29,155,240,0.22)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "rgba(29,155,240,0.12)")
                  }
                >
                  <Twitter size={14} aria-hidden="true" />
                  {t("actions.shareOnX")}
                </button>
                <button
                  onClick={copyLink}
                  className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-default)",
                    color: copied
                      ? "var(--solana-green)"
                      : "var(--text-secondary)",
                  }}
                >
                  {copied ? (
                    <>
                      <Check size={14} aria-hidden="true" /> {t("actions.copied")}
                    </>
                  ) : (
                    <>
                      <Copy size={14} aria-hidden="true" /> {t("actions.copyLink")}
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.share) {
                      navigator.share({
                        title: credential.name,
                        text: t("share.nativeText", { credential: credential.name }),
                        url: window.location.href,
                      });
                    }
                  }}
                  className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <Share2 size={14} aria-hidden="true" />
                  {t("actions.share")}
                </button>
                <button
                  title={t("actions.downloadSoon")}
                  className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 opacity-50 cursor-not-allowed"
                  disabled
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                  }}
                >
                  <Download size={14} aria-hidden="true" />
                  {t("actions.download")}
                </button>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Award
              size={16}
              className="mt-0.5 shrink-0"
              style={{ color: "var(--text-muted)" }}
              aria-hidden="true"
            />
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              {t("status.soulboundIntro")}{" "}
              <strong style={{ color: "var(--text-secondary)" }}>
                {t("status.soulboundStrong")}
              </strong>{" "}
              {t("status.soulboundOutro")}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
