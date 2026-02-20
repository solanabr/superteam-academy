import type { XPBalance } from "@/types";

export interface XPService {
  getBalance(walletAddress: string): Promise<XPBalance>;
  getBalanceByUserId(userId: string): Promise<XPBalance>;
}
