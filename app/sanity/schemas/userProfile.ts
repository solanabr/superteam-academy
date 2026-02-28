export const userProfileSchema = {
  name: 'userProfile',
  title: 'User Profile',
  type: 'document',
  fields: [
    { name: 'walletAddress', title: 'Wallet Address', type: 'string' },
    { name: 'username', title: 'Username', type: 'string' },
    { name: 'avatar', title: 'Avatar', type: 'url' },
    { name: 'xp', title: 'XP', type: 'number', initialValue: 0 },
    { name: 'streak', title: 'Streak', type: 'number', initialValue: 0 },
    { name: 'badges', title: 'Badges', type: 'array', of: [{ type: 'string' }] },
    { name: 'rank', title: 'Rank', type: 'number', initialValue: 0 },
  ],
} as const;
