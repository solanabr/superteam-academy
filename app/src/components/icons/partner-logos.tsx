import type { SVGProps } from "react";

interface LogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

/** Solana — stylized S-curve gradient mark */
export function SolanaLogo({ size = 32, ...props }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="32" height="32" rx="8" fill="#9945FF" />
      <path
        d="M9 20.5L12.3 17H23L19.7 20.5H9Z"
        fill="url(#sol-g1)"
      />
      <path
        d="M9 11.5L12.3 15H23L19.7 11.5H9Z"
        fill="url(#sol-g2)"
      />
      <path
        d="M9 16L12.3 12.5H23L19.7 16H9Z"
        fill="url(#sol-g3)"
      />
      <defs>
        <linearGradient id="sol-g1" x1="9" y1="18.75" x2="23" y2="18.75" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
        <linearGradient id="sol-g2" x1="9" y1="13.25" x2="23" y2="13.25" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
        <linearGradient id="sol-g3" x1="9" y1="14.25" x2="23" y2="14.25" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Superteam — shield with star */
export function SuperteamLogo({ size = 32, ...props }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="32" height="32" rx="8" fill="#4a8c5c" />
      <path
        d="M16 6L20.5 8.5V14C20.5 18.5 16 22 16 22C16 22 11.5 18.5 11.5 14V8.5L16 6Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="rgba(255,255,255,0.1)"
      />
      <path
        d="M16 11L17.2 13.5L20 13.9L18 15.8L18.5 18.5L16 17.2L13.5 18.5L14 15.8L12 13.9L14.8 13.5L16 11Z"
        fill="white"
      />
    </svg>
  );
}

/** Metaplex — layered diamond mark */
export function MetaplexLogo({ size = 32, ...props }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="32" height="32" rx="8" fill="#e8523b" />
      <path
        d="M16 7L24 16L16 25L8 16L16 7Z"
        fill="rgba(255,255,255,0.15)"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M16 11L20 16L16 21L12 16L16 11Z"
        fill="rgba(255,255,255,0.25)"
        stroke="white"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="2" fill="white" />
    </svg>
  );
}

/** Helius — sunburst mark */
export function HeliusLogo({ size = 32, ...props }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="32" height="32" rx="8" fill="#ff6b35" />
      <circle cx="16" cy="16" r="4" fill="white" />
      {/* Sun rays */}
      <line x1="16" y1="7" x2="16" y2="10" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="22" x2="16" y2="25" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="7" y1="16" x2="10" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="16" x2="25" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="9.6" y1="9.6" x2="11.7" y2="11.7" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="20.3" y1="20.3" x2="22.4" y2="22.4" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="9.6" y1="22.4" x2="11.7" y2="20.3" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="20.3" y1="11.7" x2="22.4" y2="9.6" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Anchor — nautical anchor mark */
export function AnchorLogo({ size = 32, ...props }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="32" height="32" rx="8" fill="#2d3748" />
      <circle cx="16" cy="10" r="2.5" stroke="white" strokeWidth="1.5" fill="none" />
      <line x1="16" y1="12.5" x2="16" y2="23" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="16" x2="21" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M10 21C10 21 12 24 16 24C20 24 22 21 22 21"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** Jito — lightning bolt speed mark */
export function JitoLogo({ size = 32, ...props }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="32" height="32" rx="8" fill="#00d395" />
      <path
        d="M17.5 7L10 17H15.5L14 25L22 15H16.5L17.5 7Z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Map partner name → logo component */
export const PARTNER_LOGO_MAP: Record<string, React.ComponentType<LogoProps>> = {
  Solana: SolanaLogo,
  Superteam: SuperteamLogo,
  Metaplex: MetaplexLogo,
  Helius: HeliusLogo,
  Anchor: AnchorLogo,
  Jito: JitoLogo,
};
