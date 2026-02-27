"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { useConfigPDA } from "@/lib/hooks/use-config-pda";
import { SOLANA_EXPLORER_URL } from "@/lib/constants";

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function explorerUrl(address: string): string {
  return SOLANA_EXPLORER_URL.replace("%s", address);
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--c-border-subtle)] last:border-b-0">
      <div>
        <p className="text-sm font-medium text-[var(--c-text)]">{label}</p>
        <p className="text-xs text-[var(--c-text-2)] mt-0.5">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function AddressValue({ address }: { address: string }) {
  return (
    <a
      href={explorerUrl(address)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 font-mono text-sm text-[var(--c-text-em)] hover:text-[#00FFA3] transition-colors"
    >
      {truncateAddress(address)}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

function Skeleton() {
  return (
    <div className="h-4 w-24 rounded bg-[var(--c-border-subtle)] animate-pulse" />
  );
}

export function PlatformSettings() {
  const { config, loading, error } = useConfigPDA();

  if (error) {
    return (
      <div className="space-y-4">
        <SettingRow
          label="Daily XP Cap"
          description="Maximum XP earnable per learner per day"
        >
          <span className="text-sm text-[var(--c-text-em)]">
            500 XP (program constant)
          </span>
        </SettingRow>
        <SettingRow
          label="Credential Type"
          description="Soulbound credentials via Metaplex Core"
        >
          <span className="text-sm text-[var(--c-text-em)]">Metaplex Core</span>
        </SettingRow>
        <div className="rounded-[2px] border border-amber-400/20 bg-amber-400/5 px-3 py-2">
          <p className="text-[10px] text-amber-400">
            Config PDA not available: {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SettingRow
        label="Authority"
        description="Platform authority wallet"
      >
        {loading ? (
          <Skeleton />
        ) : config ? (
          <AddressValue address={config.authority.toBase58()} />
        ) : (
          <Skeleton />
        )}
      </SettingRow>
      <SettingRow
        label="XP Mint"
        description="Token-2022 mint for XP tokens"
      >
        {loading ? (
          <Skeleton />
        ) : config ? (
          <AddressValue address={config.xpMint.toBase58()} />
        ) : (
          <Skeleton />
        )}
      </SettingRow>
      <SettingRow
        label="Backend Signer"
        description="Rotatable signer stored in Config PDA"
      >
        {loading ? (
          <Skeleton />
        ) : config ? (
          <AddressValue address={config.backendSigner.toBase58()} />
        ) : (
          <Skeleton />
        )}
      </SettingRow>
      <SettingRow
        label="Daily XP Cap"
        description="Maximum XP earnable per learner per day"
      >
        <span className="text-sm text-[var(--c-text-em)]">
          500 XP (program constant)
        </span>
      </SettingRow>
      <SettingRow
        label="Credential Type"
        description="Soulbound credentials via Metaplex Core"
      >
        <span className="text-sm text-[var(--c-text-em)]">Metaplex Core</span>
      </SettingRow>
    </div>
  );
}
