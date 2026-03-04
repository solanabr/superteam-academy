"use client";

import { WalletButton } from "@/components/WalletButton";
import { SpotlightCard } from "@/components/ui/spotlight-card";

type ProviderState = {
  google: boolean;
  github: boolean;
};

export function AuthMethodsCard({
  title,
  subtitle,
  providers,
  onGoogle,
  onGithub,
  walletLabel,
  googleLabel,
  githubLabel,
  googleUnavailable,
  githubUnavailable,
}: {
  title: string;
  subtitle: string;
  providers: ProviderState;
  onGoogle: () => void;
  onGithub: () => void;
  walletLabel: string;
  googleLabel: string;
  githubLabel: string;
  googleUnavailable: string;
  githubUnavailable: string;
}) {
  return (
    <SpotlightCard className="rounded-2xl" spotlightColor="rgba(153, 69, 255, 0.2)">
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h2>
        <p className="text-sm mt-1 mb-5" style={{ color: "var(--text-secondary)" }}>
          {subtitle}
        </p>

        <div className="space-y-3">
          <button
            onClick={onGoogle}
            disabled={!providers.google}
            className="w-full min-h-[46px] rounded-xl px-4 text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: providers.google
                ? "linear-gradient(135deg, rgba(153,69,255,0.95), rgba(25,251,155,0.72))"
                : "var(--bg-elevated)",
              border: providers.google
                ? "1px solid rgba(153,69,255,0.35)"
                : "1px solid var(--border-default)",
              color: providers.google ? "#fff" : "var(--text-primary)",
              boxShadow: providers.google
                ? "0 8px 22px rgba(153,69,255,0.28)"
                : "none",
            }}
            title={!providers.google ? googleUnavailable : undefined}
          >
            {providers.google ? googleLabel : googleUnavailable}
          </button>

          <button
            onClick={onGithub}
            disabled={!providers.github}
            className="w-full min-h-[46px] rounded-xl px-4 text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: providers.github
                ? "linear-gradient(135deg, rgba(0,140,76,0.92), rgba(47,107,63,0.82))"
                : "var(--bg-elevated)",
              border: providers.github
                ? "1px solid rgba(0,140,76,0.35)"
                : "1px solid var(--border-default)",
              color: providers.github ? "#fff" : "var(--text-primary)",
              boxShadow: providers.github
                ? "0 8px 22px rgba(0,140,76,0.28)"
                : "none",
            }}
            title={!providers.github ? githubUnavailable : undefined}
          >
            {providers.github ? githubLabel : githubUnavailable}
          </button>

          <div className="pt-2">
            <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
              {walletLabel}
            </p>
            <WalletButton />
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
}
