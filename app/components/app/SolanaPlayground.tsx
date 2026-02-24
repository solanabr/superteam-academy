"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface SolanaPlaygroundProps {
  starterCode?: string;
  className?: string;
}

export function SolanaPlayground({ starterCode, className = "" }: SolanaPlaygroundProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Debug logging
  useEffect(() => {
    console.log("SolanaPlayground rendered:", { starterCode: !!starterCode });
  }, [starterCode]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        setIsLoading(false);
        setError(null);
      };

      const handleError = () => {
        setIsLoading(false);
        setError("Failed to load Solana Playground. Please try refreshing the page.");
      };

      iframe.addEventListener("load", handleLoad);
      iframe.addEventListener("error", handleError);

      // Set a timeout to show error if iframe doesn't load
      const timeout = setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          setError("Playground is taking longer than expected to load.");
        }
      }, 10000);

      return () => {
        iframe.removeEventListener("load", handleLoad);
        iframe.removeEventListener("error", handleError);
        clearTimeout(timeout);
      };
    }
  }, [isLoading]);

  // Build the Solana Playground URL
  // Note: Solana Playground doesn't directly support code injection via URL params
  // But we can use the embed URL and users can copy/paste starter code
  const playgroundUrl = "https://beta.solpg.io/embed";

  return (
    <div className={`relative w-full h-full ${className}`} style={{ minHeight: "600px" }}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Loading Solana Playground...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <p className="text-sm text-destructive mb-2">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              if (iframeRef.current) {
                iframeRef.current.src = iframeRef.current.src;
              }
            }}
            className="text-xs text-primary hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Starter code helper - show if starter code is provided */}
      {starterCode && !isLoading && (
        <div className="absolute top-2 right-2 z-20 bg-card border border-border rounded-md p-2 shadow-lg max-w-xs">
          <p className="text-xs text-muted-foreground mb-1">Starter code available</p>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(starterCode);
                // Toast will be handled by parent component if needed
              } catch (err) {
                console.error("Failed to copy starter code:", err);
              }
            }}
            className="text-xs text-primary hover:underline"
          >
            Copy starter code
          </button>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={playgroundUrl}
        className="w-full h-full border-0"
        title="Solana Playground"
        allow="clipboard-read; clipboard-write; fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
        style={{ 
          minHeight: "600px",
          width: "100%",
          height: "100%",
          display: "block"
        }}
      />
    </div>
  );
}
