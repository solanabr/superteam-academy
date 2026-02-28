"use client";
import { Share2 } from "lucide-react";

export function CopyShareButton({ url, label }: { url: string; label: string }) {
  return (
    <button
      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#14F195] text-black font-mono font-semibold text-sm rounded hover:bg-accent-dim transition-colors"
      onClick={() => {
        navigator.clipboard.writeText(url).catch(() => {});
      }}
    >
      <Share2 className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
