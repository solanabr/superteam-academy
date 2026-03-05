"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { Link } from "@/i18n/navigation";

export function FooterLogo() {
  const { theme, resolvedTheme } = useTheme();
  // Modo diurno (dark) = aparência tema claro; modo noturno (light) = aparência tema escuro
  // Logo verde no tema claro, amarela no tema escuro
  const isLightAppearance = resolvedTheme === "dark" || theme === "dark";

  return (
    <Link
      href="/"
      className="inline-block transition-transform hover:scale-105"
    >
      <Image
        src={
          isLightAppearance
            ? "/superteam-brasil-logo-green.png"
            : "/superteam-brasil-logo.png"
        }
        alt="Superteam Brasil"
        width={152}
        height={45}
        className="h-11 w-auto drop-shadow-md"
      />
    </Link>
  );
}
