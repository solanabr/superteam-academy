export interface AdminStats {
  totalUsers: number;
  activeEnrollments: number;
  xpMinted: number;
  completionRate: number; // percentage
  revenueGenerated?: number; // optional, if applicable
}

export interface ActionLog {
  id: string;
  timestamp: string;
  action: string;
  wallet: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  details?: string;
}

export interface MinterRole {
  pubkey: string;
  label: string;
  totalXpMinted: number;
  isActive: boolean;
}

export const mockAdminStats: AdminStats = {
  totalUsers: 4592,
  activeEnrollments: 1240,
  xpMinted: 1250400,
  completionRate: 68
};

export const mockActionLogs: ActionLog[] = [
  {
    id: 'log-1',
    timestamp: '2 mins ago',
    action: 'COMPLETE_LESSON',
    wallet: '0xKD...92A',
    status: 'SUCCESS',
    details: 'Course: solana-fundamentals, Lesson: 3'
  },
  {
    id: 'log-2',
    timestamp: '15 mins ago',
    action: 'ISSUE_CREDENTIAL',
    wallet: '0x1A...B8C',
    status: 'SUCCESS',
    details: 'Track: Core Development'
  },
  {
    id: 'log-3',
    timestamp: '1 hour ago',
    action: 'UPDATE_CONFIG',
    wallet: 'ACAd...hgqYn',
    status: 'PENDING',
    details: 'Rotate backend signer (Multisig threshold 2/3)'
  },
  {
    id: 'log-4',
    timestamp: '3 hours ago',
    action: 'ENROLL',
    wallet: '0xZ9...44F',
    status: 'FAILED',
    details: 'PrerequisiteNotMet'
  }
];

export const mockMinters: MinterRole[] = [
  {
    pubkey: 'backend-signer-prod',
    label: 'Primary Backend Signer',
    totalXpMinted: 950000,
    isActive: true
  },
  {
    pubkey: 'irl-events-minter',
    label: 'IRL Event QR Codes',
    totalXpMinted: 50400,
    isActive: true
  },
  {
    pubkey: 'legacy-backend-v1',
    label: 'Legacy Signer V1',
    totalXpMinted: 250000,
    isActive: false
  }
];
