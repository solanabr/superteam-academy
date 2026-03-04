"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Confetti } from "@/components/Confetti";
import type { Credential } from "@/hooks/useCredentials";

interface CredentialModalProps {
  credential: Credential | null;
  onClose: () => void;
}

export function CredentialModal({ credential, onClose }: CredentialModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("CredentialModal");
  const isOpen = credential !== null;

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);

    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      "button, [href], [tabindex]:not([tabindex='-1'])",
    );
    firstFocusable?.focus();

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !credential) return null;

  const { name, image, attributes, explorerUrl, isStub } = credential;

  return (
    <>
      <Confetti active={isOpen} />

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="credential-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-purple)",
            boxShadow:
              "0 0 0 1px rgba(153,69,255,0.1) inset, 0 24px 60px rgba(153,69,255,0.25)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: "var(--text-purple)" }}
              >
                {t("unlocked")}
              </p>
              <h2
                id="credential-modal-title"
                className="text-xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {t("earned")}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label={t("closeAria")}
              className="transition-colors duration-150"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  "var(--text-primary)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  "var(--text-muted)")
              }
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
              </svg>
            </button>
          </div>

          <div
            className="w-36 h-36 mx-auto rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: "var(--bg-elevated)" }}
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                width="56"
                height="56"
                viewBox="0 0 56 56"
                fill="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="modal-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--solana-purple)" />
                    <stop offset="100%" stopColor="var(--solana-green)" />
                  </linearGradient>
                </defs>
                <circle
                  cx="28"
                  cy="28"
                  r="26"
                  stroke="url(#modal-grad)"
                  strokeWidth="1.5"
                />
                <path
                  d="M28 16l3.53 7.51 7.87 1.14-5.7 5.85 1.35 8.27L28 34.8l-7.05 3.97 1.35-8.27-5.7-5.85 7.87-1.14L28 16z"
                  stroke="url(#modal-grad)"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>

          <div className="text-center">
            <p
              className="font-semibold text-base"
              style={{ color: "var(--text-primary)" }}
            >
              {name}
            </p>
          </div>

          {attributes.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {attributes.map((attr, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-full"
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

          <div className="flex flex-col gap-2 mt-1">
            {!isStub && explorerUrl !== "#" && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center min-h-[44px] flex items-center justify-center px-4 rounded-xl font-semibold text-sm transition-all duration-150"
                style={{
                  background: "var(--solana-purple)",
                  color: "#fff",
                }}
              >
                {t("viewExplorer")}
              </a>
            )}
            <button
              onClick={onClose}
              className="w-full min-h-[44px] px-4 rounded-xl text-sm font-medium transition-all duration-150"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                color: "var(--text-secondary)",
              }}
            >
              {t("continue")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
