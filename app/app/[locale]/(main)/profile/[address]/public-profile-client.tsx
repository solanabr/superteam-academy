"use client";

import { useTranslations } from "next-intl";
import { useConnection } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { XpDisplay } from "@/components/xp/xp-display";
import { LevelProgress } from "@/components/xp/level-progress";
import { CredentialCard } from "@/components/credentials/credential-card";
import { WalletAvatar } from "@/components/profile/wallet-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getXpBalance } from "@/lib/xp-token";
import { getCredentialsByOwner, type CredentialAsset } from "@/lib/credentials";
import { TRACK_COLLECTION } from "@/lib/constants";
import { truncateWallet } from "@/lib/format";
import { motion } from "motion/react";
import dynamic from "next/dynamic";

const SkillRadar = dynamic(
  () => import("@/components/profile/skill-radar").then((m) => m.SkillRadar),
  { ssr: false, loading: () => <div className="h-[250px] w-full animate-pulse rounded-xl bg-card" /> },
);

export default function PublicProfileClient({ address }: { address: string }) {
  const t = useTranslations("profile");
  const { connection } = useConnection();

  let pubkey: PublicKey | null = null;
  try {
    pubkey = new PublicKey(address);
  } catch {
    // invalid address
  }

  const { data: xp, isLoading: xpLoading } = useQuery({
    queryKey: ["xpBalance", address],
    queryFn: () => getXpBalance(connection, pubkey!),
    enabled: !!pubkey,
    staleTime: 30_000,
  });

  const { data: credentials, isLoading: credsLoading } = useQuery<CredentialAsset[]>({
    queryKey: ["credentials", address],
    queryFn: () => getCredentialsByOwner(address, TRACK_COLLECTION?.toBase58()),
    enabled: !!pubkey,
    staleTime: 60_000,
  });

  if (!pubkey) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
        <p className="text-sm text-content-muted">{t("invalidAddress")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 flex items-center gap-4"
      >
        <WalletAvatar address={address} size={56} />
        <div>
          <h1 className="text-3xl font-bold text-content">{t("publicTitle")}</h1>
          <p className="mt-1 font-mono text-sm text-content-muted">
            {truncateWallet(address, 8)}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-6 rounded-2xl border border-edge-soft bg-card p-6"
      >
        {xpLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-14 w-48" />
            <Skeleton className="h-2 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <XpDisplay xp={xp ?? 0} />
            <LevelProgress xp={xp ?? 0} />
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-6 rounded-2xl border border-edge-soft bg-card p-6"
      >
        <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-content-muted">
          {t("skills")}
        </h2>
        <SkillRadar xp={xp ?? 0} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-content-muted">
          {t("credentials")}
        </h2>
        {credsLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        ) : !credentials?.length ? (
          <p className="py-8 text-center text-sm text-content-muted">
            {t("noCredentials")}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {credentials.map((c, i) => (
              <CredentialCard key={c.id} credential={c} index={i} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
