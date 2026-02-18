import { useId } from "react";

interface SolanaLogoProps {
  className?: string;
  /** "official" uses Solana's green→purple, "brand" uses Superteam Academy's purple→teal */
  variant?: "official" | "brand";
}

export function SolanaLogo({
  className,
  variant = "official",
}: SolanaLogoProps) {
  const id = useId();
  const g1 = `${id}-g1`;
  const g2 = `${id}-g2`;
  const g3 = `${id}-g3`;

  const startColor = variant === "brand" ? "#9945FF" : "#00FFA3";
  const endColor = variant === "brand" ? "#14F195" : "#DC1FFF";

  return (
    <svg
      className={className}
      viewBox="0 0 397.7 311.7"
      aria-hidden="true"
      fill="none"
    >
      <linearGradient
        id={g1}
        x1="360.879"
        x2="141.213"
        y1="351.455"
        y2="-69.294"
        gradientTransform="matrix(1 0 0 -1 0 314)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor={startColor} />
        <stop offset="1" stopColor={endColor} />
      </linearGradient>
      <path
        d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z"
        fill={`url(#${g1})`}
      />
      <linearGradient
        id={g2}
        x1="264.829"
        x2="45.163"
        y1="401.601"
        y2="-19.148"
        gradientTransform="matrix(1 0 0 -1 0 314)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor={startColor} />
        <stop offset="1" stopColor={endColor} />
      </linearGradient>
      <path
        d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z"
        fill={`url(#${g2})`}
      />
      <linearGradient
        id={g3}
        x1="312.548"
        x2="92.882"
        y1="376.688"
        y2="-44.061"
        gradientTransform="matrix(1 0 0 -1 0 314)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor={startColor} />
        <stop offset="1" stopColor={endColor} />
      </linearGradient>
      <path
        d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"
        fill={`url(#${g3})`}
      />
    </svg>
  );
}
