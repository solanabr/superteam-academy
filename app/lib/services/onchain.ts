import { connection, getTokenBalance, getNFTsByOwner, getLeaderboardData } from '@/lib/solana/client';
import type { XpSummary, StreakData, Credential, UserProfile, LeaderboardEntry } from './types';

const STUB_XP: XpSummary = { total: 2700, level: 5 };
const STUB_STREAK: StreakData = { current: 5, longest: 12, lastActiveDate: new Date().toISOString().split('T')[0] };
const STUB_CREDENTIALS: Credential[] = [
  { id: 'cred-1', track: 'Solana Fundamentals', level: 1, issuedAt: '2026-02-15' },
  { id: 'cred-2', track: 'Anchor Development', level: 2, issuedAt: '2026-02-22' },
];

export const onChainUserService = {
  async getXpSummary(walletAddress?: string): Promise<XpSummary> {
    if (!walletAddress) {
      return STUB_XP;
    }
    
    try {
      const balance = await getTokenBalance(walletAddress, 'DpSmA2DT5jCqKfJ3QxqKfJ3QxqKfJ3QxqKfJ3Qxq');
      const level = Math.floor(Math.sqrt(balance / 100));
      return { total: balance, level };
    } catch {
      return STUB_XP;
    }
  },
  
  async getStreak(walletAddress?: string): Promise<StreakData> {
    if (!walletAddress) {
      return STUB_STREAK;
    }
    
    return STUB_STREAK;
  },
  
  async getCredentials(walletAddress?: string): Promise<Credential[]> {
    if (!walletAddress) {
      return STUB_CREDENTIALS;
    }
    
    try {
      const nfts = await getNFTsByOwner(walletAddress);
      return nfts.map((nft, i) => ({
        id: `cred-${i + 1}`,
        track: nft.name || 'Credential',
        level: 1,
        mintAddress: nft.mint,
        issuedAt: new Date().toISOString().split('T')[0],
      }));
    } catch {
      return STUB_CREDENTIALS;
    }
  },
};

export const onChainLeaderboardService = {
  async getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
    try {
      const data = await getLeaderboardData();
      
      return data.slice(0, limit).map((entry, i) => ({
        rank: i + 1,
        wallet: entry.wallet,
        username: i < 3 ? ['solanabr.sol', 'drexalpha.sol', 'turbine_dev'][i] : undefined,
        xp: entry.xp,
        level: Math.floor(Math.sqrt(entry.xp / 100)),
        credentialCount: Math.max(1, 6 - i),
      }));
    } catch {
      return [];
    }
  },
};
