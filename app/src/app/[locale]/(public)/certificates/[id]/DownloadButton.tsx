"use client";
import { Download } from "lucide-react";

export function DownloadButton({ label }: { label: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#1F1F1F] text-[#666666] hover:text-[#EDEDED] hover:border-[#2E2E2E] font-mono text-sm rounded transition-colors"
    >
      <Download className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
