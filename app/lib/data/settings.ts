// Settings data structures and mock data

export interface ConnectedWallet {
  provider: string;
  address: string;
  connected: boolean;
}

export interface OAuthProvider {
  name: string;
  icon: string;
  linked: boolean;
}

export interface UserSettings {
  profile: {
    avatar: string;
    displayName: string;
    bio: string;
    socialLinks: {
      twitter?: string;
      github?: string;
    };
  };
  account: {
    email: string;
    wallets: ConnectedWallet[];
    oauthProviders: OAuthProvider[];
  };
  interface: {
    language: string;
    theme: 'light' | 'dark';
    notifications: {
      newCourses: boolean;
      leaderboardAlerts: boolean;
      directMessages: boolean;
    };
  };
  privacy: {
    publicVisibility: boolean;
    anonymousAnalytics: boolean;
  };
}

export interface SyncStatus {
  lastSync: string;
  integrity: string;
  encryption: string;
}

export interface SystemNotice {
  message: string;
}

export interface SystemLogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'error';
}

// Mock user settings
export const mockUserSettings: UserSettings = {
  profile: {
    avatar: 'bi-person-fill',
    displayName: '0xKD...92A',
    bio: 'Senior Solana Architect. Building the decentralized future, one block at a time.',
    socialLinks: {
      twitter: '@handle',
      github: 'github.com/username',
    },
  },
  account: {
    email: 'operator@solana.io',
    wallets: [
      {
        provider: 'Phantom',
        address: '0xKD...92A',
        connected: true,
      },
      {
        provider: 'Backpack',
        address: '',
        connected: false,
      },
    ],
    oauthProviders: [
      {
        name: 'Google',
        icon: 'bi-google',
        linked: true,
      },
      {
        name: 'GitHub',
        icon: 'bi-github',
        linked: true,
      },
    ],
  },
  interface: {
    language: 'en-us',
    theme: 'light',
    notifications: {
      newCourses: true,
      leaderboardAlerts: false,
      directMessages: true,
    },
  },
  privacy: {
    publicVisibility: true,
    anonymousAnalytics: false,
  },
};

export const mockSyncStatus: SyncStatus = {
  lastSync: '2024-05-12 14:02',
  integrity: 'VERIFIED',
  encryption: 'AES-256-GCM',
};

export const mockSystemNotices: SystemNotice[] = [
  { message: '// Profile changes require signature' },
  { message: '// Email verification pending' },
  { message: '// 2FA recommended for high-rank operators' },
];

export const mockSystemLog: SystemLogEntry[] = [
  {
    timestamp: '09:12',
    message: 'Auth token refreshed',
    type: 'info',
  },
  {
    timestamp: '08:45',
    message: 'Theme preference cached',
    type: 'info',
  },
  {
    timestamp: '07:22',
    message: 'Failed attempt: Change Node ID',
    type: 'error',
  },
];

// Helper functions
export function getUserSettings(): UserSettings {
  return mockUserSettings;
}

export function getSyncStatus(): SyncStatus {
  return mockSyncStatus;
}

export function getSystemNotices(): SystemNotice[] {
  return mockSystemNotices;
}

export function getSystemLog(): SystemLogEntry[] {
  return mockSystemLog;
}

export function updateSettings(settings: Partial<UserSettings>): void {
  // In real app, save to backend
  console.log('Settings updated:', settings);
}
