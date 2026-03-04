"use client";

import Link from "next/link";
import type { Credential } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, ExternalLink } from "lucide-react";
import { TRACK_LABELS } from "@/config/constants";

interface CertificateCardProps {
  credential: Credential;
}

export function CertificateCard({ credential }: CertificateCardProps) {
  const trackName = TRACK_LABELS[credential.trackId] || "unknown";

  return (
    <Link href={`/certificates/${credential.assetId}`}>
      <Card className="group relative overflow-hidden p-4 transition-all hover:shadow-lg hover:border-violet-500/20">
        <div className="absolute top-0 right-0 h-20 w-20 bg-gradient-to-bl from-violet-500/10 to-transparent" />
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Award className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold truncate group-hover:text-violet-500 transition-colors">
              {credential.name}
            </h4>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {trackName}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {credential.totalXp.toLocaleString()} XP
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <ExternalLink className="h-3 w-3" />
              <span className="truncate font-mono">
                {credential.mintAddress}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
