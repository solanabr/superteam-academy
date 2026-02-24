"use client";

/**
 * Deterministic gradient avatar derived from a wallet address.
 * No external deps — hashes the address bytes to pick hue/saturation.
 */
export function WalletAvatar({
  address,
  size = 48,
  className = "",
}: {
  address: string;
  size?: number;
  className?: string;
}) {
  // Simple hash: sum char codes
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (hash * 31 + address.charCodeAt(i)) | 0;
  }
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 40 + (Math.abs(hash >> 8) % 80)) % 360;
  const sat = 60 + (Math.abs(hash >> 16) % 30);

  return (
    <div
      className={`shrink-0 rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${hue1}, ${sat}%, 55%), hsl(${hue2}, ${sat}%, 45%))`,
      }}
    />
  );
}
