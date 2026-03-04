"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import type { Credential } from "@/hooks/useCredentials";
import { SpotlightCard } from "@/components/ui/spotlight-card";

interface CredentialCardProps {
  credential: Credential;
  locale?: string;
}

export function CredentialCard({ credential, locale }: CredentialCardProps) {
  const t = useTranslations("CredentialCard");
  const currentLocale = useLocale();
  const effectiveLocale = locale ?? currentLocale;
  const { name, image, attributes, explorerUrl, isStub } = credential;
  const certHref = `/${effectiveLocale}/certificates/${credential.id}`;

  return (
    <SpotlightCard className="rounded-xl" spotlightColor="rgba(153, 69, 255, 0.2)">
      <Link
        href={certHref}
        className="rounded-xl p-4 flex flex-col gap-3 block transition-all duration-200 hover:-translate-y-0.5"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-purple)",
          boxShadow: "0 0 0 1px rgba(153,69,255,0.08) inset",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.boxShadow = "var(--shadow-card-hover)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.boxShadow = "0 0 0 1px rgba(153,69,255,0.08) inset";
        }}
      >
        <div
          className="w-full aspect-square rounded-lg overflow-hidden flex items-center justify-center"
          style={{ background: "var(--bg-elevated)" }}
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div
              className="flex flex-col items-center gap-2"
              style={{ color: "var(--text-muted)" }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 48 48"
                fill="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="cred-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--solana-purple)" />
                    <stop offset="100%" stopColor="var(--solana-green)" />
                  </linearGradient>
                </defs>
                <circle
                  cx="24"
                  cy="24"
                  r="22"
                  stroke="url(#cred-grad)"
                  strokeWidth="1.5"
                />
                <path
                  d="M24 14l2.94 6.26 6.56.95-4.75 4.87 1.12 6.88L24 29.77l-5.87 3.19 1.12-6.88L14.5 21.21l6.56-.95L24 14z"
                  stroke="url(#cred-grad)"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t("placeholder")}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-2">
          <p
            className="font-semibold text-sm leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {name}
          </p>
        </div>

        {attributes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {attributes.map((attr, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  color: "var(--text-purple)",
                  background: "rgba(153,69,255,0.1)",
                  border: "1px solid rgba(153,69,255,0.2)",
                }}
              >
                {attr.trait_type}: {attr.value}
              </span>
            ))}
          </div>
        )}

        {!isStub && explorerUrl !== "#" && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs transition-colors duration-150 hover:underline"
            style={{ color: "var(--text-purple)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {t("viewExplorer")}
          </a>
        )}
      </Link>
    </SpotlightCard>
  );
}
