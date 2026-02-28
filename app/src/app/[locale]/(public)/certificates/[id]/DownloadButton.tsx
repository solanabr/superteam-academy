"use client";
import { Download } from "lucide-react";

export function DownloadButton({ label }: { label: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-muted-foreground hover:text-foreground hover:border-border-hover font-mono text-sm rounded transition-colors"
    >
      <Download className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
