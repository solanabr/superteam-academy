"use client";

import { SocialIcon } from "react-social-icons";

const LINKS = [
  { url: "https://x.com/superteambr", label: "X (Twitter)" },
  { url: "https://discord.gg/superteam", label: "Discord" },
  { url: "https://t.me/superteambr", label: "Telegram" },
  { url: "https://linkedin.com/company/superteambr", label: "LinkedIn" },
] as const;

const ICON_SIZE = 28;

/**
 * Ícones de redes sociais do footer via react-social-icons, com estilo 3D (sombra e elevação).
 */
export function FooterSocialIcons() {
  return (
    <div className="mt-4 flex gap-4">
      {LINKS.map(({ url, label }) => (
        <SocialIcon
          key={url}
          url={url}
          target="_blank"
          rel="noopener noreferrer"
          label={label}
          className="footer-social-3d"
          style={{ height: ICON_SIZE, width: ICON_SIZE }}
        />
      ))}
    </div>
  );
}
