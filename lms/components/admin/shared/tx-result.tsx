"use client";

import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { shortenAddress } from "@/lib/utils";

export function TxResult({ signature }: { signature: string }) {
  const url = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="font-mono text-xs">
        {shortenAddress(signature, 8)}
      </Badge>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
