"use client";

import { useState } from "react";

/** Placeholder local — mesma origem, sempre carrega (evita falhas de rede/externos) */
const PLACEHOLDER_SRC = "/placeholder-banner.svg";

/**
 * Imagem externa via <img> nativo — bypass do Next.js Image para URLs externas.
 * Se a imagem falhar, exibe placeholder visual (não letra).
 */
interface RemoteImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function RemoteImage({ src, alt, className = "" }: RemoteImageProps) {
  const [error, setError] = useState(false);

  const displaySrc = error ? PLACEHOLDER_SRC : src;
  return (
    <img
      src={displaySrc}
      alt={alt}
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
    />
  );
}
