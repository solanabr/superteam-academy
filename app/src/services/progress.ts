
// Type only import
export type User = {
    walletAddress: string;
    username: string;
    email?: string;
    telegram?: string;
    discord?: string;
    phoneNumber?: string;
    xp: number;
    level: number;
    streak: number;
    achievements: string[];
    completedLessons: string[];
};

export const ProgressService = {
  login: async (walletAddress: string): Promise<any> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress })
    });
    const data = await res.json();
    return data.user;
  },

  completeLesson: async (walletAddress: string, lessonId: string, xpEarned: number): Promise<any> => {
    // 1. Update DB progress
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, lessonId, xpEarned })
    });
    const data = await res.json();

    // 2. Mint On-Chain XP
    let mintSuccess = false;
    let mintTx: string | null = null;
    try {
        const mintRes = await fetch('/api/solana/mint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress, amount: xpEarned }) 
        });
        
        if (mintRes.ok) {
            const mintData = await mintRes.json();
            mintSuccess = mintData.success === true;
            mintTx = mintData.tx || null;
            console.log('✅ On-chain XP minted:', mintTx);
        } else {
            const errorData = await mintRes.json().catch(() => ({}));
            console.error('❌ Mint API returned error:', mintRes.status, errorData);
        }
    } catch (e) {
        console.error("❌ Failed to call mint API:", e);
    }

    return { ...data.user, mintSuccess, mintTx };
  },

  getLeaderboard: async (): Promise<any[]> => {
    const res = await fetch('/api/leaderboard');
    const data = await res.json();
    return data.leaderboard;
  },

  async updateProfile(walletAddress: string, data: Partial<User>): Promise<User> {
    const res = await fetch('/api/user/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, ...data }),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  async enrollCourse(walletAddress: string, courseSlug: string): Promise<User> {
    const res = await fetch('/api/courses/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, courseSlug }),
    });
    if (!res.ok) throw new Error('Failed to enroll in course');
    return res.json();
  },
};
