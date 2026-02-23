"use client";

import { CLUSTER } from "@/lib/constants";

export function NetworkBadge() {
  if (CLUSTER !== "devnet") return null;

  return (
    <span className="rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-400 border border-yellow-500/20">
      Devnet
    </span>
  );
}
