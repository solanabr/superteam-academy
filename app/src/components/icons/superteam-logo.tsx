import type { SVGProps } from "react";

interface SuperteamLogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

/**
 * Superteam Academy logo — graduation cap with blockchain/hexagon motif.
 * Used in the site header and favicon contexts.
 */
export function SuperteamAcademyLogo({ size = 32, ...props }: SuperteamLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Superteam Academy"
      {...props}
    >
      <rect width="32" height="32" rx="8" fill="url(#sta-bg)" />
      {/* Graduation cap */}
      <path
        d="M16 8L6 13L16 18L26 13L16 8Z"
        fill="url(#sta-cap)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="0.5"
      />
      {/* Cap brim shadow */}
      <path d="M10 15V20C10 20 13 22.5 16 22.5C19 22.5 22 20 22 20V15L16 18L10 15Z" fill="url(#sta-brim)" />
      {/* Tassel */}
      <line x1="24" y1="13" x2="24" y2="20" stroke="#d4b83d" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="20.5" r="1.5" fill="#d4b83d" />
      <defs>
        <linearGradient id="sta-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e3a28" />
          <stop offset="1" stopColor="#2d5a3c" />
        </linearGradient>
        <linearGradient id="sta-cap" x1="6" y1="8" x2="26" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.95" />
          <stop offset="1" stopColor="white" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id="sta-brim" x1="10" y1="15" x2="22" y2="22.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.6" />
          <stop offset="1" stopColor="white" stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  );
}
