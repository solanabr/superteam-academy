"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Award } from "lucide-react";

const PLACEHOLDER_URI_ENV = typeof process.env.NEXT_PUBLIC_CREDENTIAL_PLACEHOLDER_URI === "string"
  ? process.env.NEXT_PUBLIC_CREDENTIAL_PLACEHOLDER_URI.trim()
  : "";

function isPlaceholderUri(uri: string | null | undefined): boolean {
  if (!uri) return true;
  if (PLACEHOLDER_URI_ENV && uri === PLACEHOLDER_URI_ENV) return true;
  return uri.includes("placeholder");
}

type CredentialImageProps = {
  /** Direct image URL from DAS or pre-resolved */
  imageUrl?: string | null;
  /** On-chain metadata JSON URI; we fetch and read "image" when imageUrl is missing */
  metadataUri?: string | null;
  /** When no image from NFT metadata (e.g. placeholder or old mint), show collection image for this track */
  fallbackImageUrl?: string | null;
  /** Size: "sm" (list card) or "lg" (detail page) */
  size?: "sm" | "lg";
  className?: string;
};

export function CredentialImage({
  imageUrl,
  metadataUri,
  fallbackImageUrl,
  size = "sm",
  className = "",
}: CredentialImageProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (imageUrl) return;
    if (!metadataUri || isPlaceholderUri(metadataUri)) return;
    let cancelled = false;
    const proxyUrl = `/api/credential-metadata?uri=${encodeURIComponent(metadataUri)}`;
    fetch(proxyUrl)
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { image?: string } | null) => {
        if (cancelled || !json || typeof json.image !== "string") return;
        setResolvedUrl(json.image);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [metadataUri, imageUrl]);

  const src = imageUrl ?? resolvedUrl ?? fallbackImageUrl ?? null;
  const isSm = size === "sm";

  if (src) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-lg bg-muted ${isSm ? "h-12 w-12" : "h-20 w-20 rounded-full"} ${className}`}
      >
        <Image
          src={src}
          alt="Credential"
          fill
          className="object-cover"
          unoptimized
          sizes={isSm ? "48px" : "80px"}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg bg-primary/10 ${isSm ? "h-12 w-12" : "h-20 w-20 rounded-full"} ${className}`}
    >
      <Award className={isSm ? "h-6 w-6 text-primary" : "h-10 w-10 text-primary"} />
    </div>
  );
}
