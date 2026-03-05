"use client";

import Image from "next/image";
import { useTheme } from "next-themes";

/**
 * Logo Solana no hero: versão normal no modo diurno, versão branca/gradiente no modo noturno.
 */
export function HeroSolanaLogo() {
  const { resolvedTheme } = useTheme();
  const isNightMode = resolvedTheme === "light";

  return (
    <Image
      src={isNightMode ? "/solana-logo-light.png" : "/solana-logo.png"}
      alt="Solana"
      width={1024}
      height={153}
      priority
      sizes="(max-width: 640px) 180px, (max-width: 768px) 220px, 280px"
      className="inline-block h-9 w-auto sm:h-11 md:h-12 lg:h-14 object-contain drop-shadow-md"
    />
  );
}
