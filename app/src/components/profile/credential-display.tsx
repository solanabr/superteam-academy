"use client";

import {
  Shield,
  Code,
  TrendingUp,
  Layout,
  Coins,
  BookOpen,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatXP } from "@/lib/utils";
import { useTracks } from "@/lib/hooks/use-tracks";
import { EmptyState } from "@/components/ui/empty-state";
import { EmptyCredentialsIllustration } from "@/components/icons";

export interface CredentialItem {
  trackId: number;
  trackName: string;
  currentLevel: number;
  label: string;
  coursesCompleted: number;
  totalXp: number;
  metadataUri?: string;
}

interface CredentialDisplayProps {
  credentials: CredentialItem[];
  title: string;
  emptyMessage: string;
}

function TrackIcon({
  trackId,
  className,
}: {
  trackId: number;
  className?: string;
}) {
  const base = cn("h-5 w-5", className);
  switch (trackId) {
    case 1:
      return <Shield className={base} />;
    case 2:
      return <Code className={base} />;
    case 3:
      return <TrendingUp className={base} />;
    case 4:
      return <Shield className={base} />;
    case 5:
      return <Layout className={base} />;
    case 6:
      return <Coins className={base} />;
    default:
      return <BookOpen className={base} />;
  }
}

export function CredentialDisplay({
  credentials,
  title,
  emptyMessage,
}: CredentialDisplayProps) {
  const t = useTranslations("profile");
  const TRACKS = useTracks();
  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {credentials.length > 0 ? (
        <div className="space-y-3">
          {credentials.map((cred) => {
            const track = TRACKS[cred.trackId];
            return (
              <div
                key={cred.trackId}
                className="rounded-xl border border-white/5 bg-muted/20 p-4 transition-colors hover:border-st-green/20"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: track
                        ? `${track.color}15`
                        : "rgba(255,255,255,0.05)",
                    }}
                  >
                    <TrackIcon trackId={cred.trackId} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold">{cred.trackName}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {cred.label} (
                      {t("credentialLevel", { level: cred.currentLevel })})
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {t("credentialCoursesCompleted", {
                      count: cred.coursesCompleted,
                    })}
                  </span>
                  <span className="font-semibold text-xp">
                    {formatXP(cred.totalXp)} XP
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex w-fit items-center gap-1.5 rounded-full bg-st-green/10 px-2.5 py-1 text-xs font-medium text-st-green-light">
                    <Shield className="h-3 w-3" />
                    {t("verifiedOnChain")}
                  </div>
                  {cred.metadataUri && (
                    <a
                      href={`https://explorer.solana.com/address/${cred.metadataUri}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brazil-green hover:underline"
                    >
                      Verify on-chain ↗
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          illustration={
            <EmptyCredentialsIllustration className="h-full w-full" />
          }
          title={emptyMessage}
          compact
        />
      )}
    </section>
  );
}
