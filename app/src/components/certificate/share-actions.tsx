"use client";

import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

export function ShareActions({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(
    `I earned a Superteam Academy credential: ${url}`,
  )}`;

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" className="border-border bg-transparent text-foreground" onClick={() => void handleCopy()}>
        <Copy className="size-4" />
        {copied ? "Copied" : "Copy link"}
      </Button>
      <Button asChild variant="outline" className="border-border bg-transparent text-foreground">
        <a href={twitterUrl} target="_blank" rel="noreferrer">
          Share on X
          <ExternalLink className="size-4" />
        </a>
      </Button>
    </div>
  );
}
