import type { XpService } from "./interfaces";
import { deriveLevel } from "@/types";

const STORAGE_KEY = "academy_xp";

function loadXp(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveXp(data: Record<string, number>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Read XP balance from localStorage for a wallet */
export function getLocalXp(wallet: string): number {
  const data = loadXp();
  return data[wallet] ?? 0;
}

/** Add XP to a wallet (internal helper) */
export function addXp(wallet: string, amount: number): number {
  const data = loadXp();
  data[wallet] = (data[wallet] ?? 0) + amount;
  saveXp(data);
  return data[wallet];
}

/**
 * Stub XP service using localStorage.
 *
 * On-chain swap:
 * - getBalance → getTokenAccountBalance(xpAta) via Token-2022
 * - XP mint: xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3
 * - ATA derived: getAssociatedTokenAddressSync(xpMint, wallet, false, TOKEN_2022_PROGRAM_ID)
 */
export class LocalXpService implements XpService {
  async getBalance(wallet: string): Promise<number> {
    const data = loadXp();
    return data[wallet] ?? 0;
  }

  async getLevel(wallet: string): Promise<number> {
    const balance = await this.getBalance(wallet);
    return deriveLevel(balance);
  }
}
