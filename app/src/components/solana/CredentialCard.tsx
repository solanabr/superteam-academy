import Image from "next/image";
import { ExternalLink, Shield } from "lucide-react";
import { solanaExplorerUrl } from "@/lib/solana";
import { TRACKS } from "@/types";
import type { Credential } from "@/types";

interface CredentialCardProps {
  credential: Credential;
}

export function CredentialCard({ credential }: CredentialCardProps) {
  const trackId = Number(credential.attributes.trackId ?? 0);
  const track = TRACKS[trackId];
  const level = credential.attributes.level ?? "1";
  const xp = credential.attributes.totalXp ?? "0";

  return (
    <div className="group bg-[#111111] border border-[#1F1F1F] rounded hover:border-[#14F195]/30 transition-all duration-200 overflow-hidden">
      {/* Image / placeholder */}
      <div className="relative h-32 bg-[#0A0A0A] flex items-center justify-center overflow-hidden">
        {credential.imageUrl ? (
          <Image
            src={credential.imageUrl}
            alt={credential.name}
            fill
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${track?.color ?? "#14F195"}20 0%, transparent 70%)`,
            }}
          >
            <Shield className="h-10 w-10 text-[#14F195] opacity-40" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className="text-[10px] font-mono bg-[#0A0A0A]/90 text-[#14F195] border border-[#14F195]/30 px-2 py-0.5 rounded-sm">
            Lv.{level}
          </span>
        </div>
      </div>

      <div className="p-3">
        <h4 className="font-mono text-sm font-semibold text-[#EDEDED] truncate">
          {credential.name}
        </h4>
        <p className="text-[10px] text-[#666666] font-mono mt-0.5">
          {track ? `${track.icon} ${track.name}` : "Academy Credential"}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] font-mono text-[#14F195]">
            {Number(xp).toLocaleString()} XP
          </span>
          <a
            href={solanaExplorerUrl(credential.assetAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#666666] hover:text-[#EDEDED] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
