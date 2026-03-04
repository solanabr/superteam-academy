"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check } from "lucide-react";

export function CodeCopyButton({ code }: { code: string }) {
  const t = useTranslations("common");
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-background/80 px-2.5 py-1.5 text-xs text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={copied ? t("copied") : t("copyCode")}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
      <span className="text-xs">{copied ? t("copied") : t("copy")}</span>
    </button>
  );
}
