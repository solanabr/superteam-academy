export function formatXp(xp: number): string {
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`;
  if (xp >= 1_000) return `${(xp / 1_000).toFixed(1)}K`;
  return xp.toString();
}

export function truncateWallet(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatDate(ts: number, locale = "en"): string {
  return new Date(ts * 1000).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function difficultyLabel(d: number): string {
  return ["", "Beginner", "Intermediate", "Advanced"][d] ?? "Unknown";
}

export function solscanTxUrl(sig: string, cluster = "devnet"): string {
  return `https://solscan.io/tx/${sig}?cluster=${cluster}`;
}
