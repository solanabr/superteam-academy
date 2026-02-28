/**
 * Role-Based Access Control (RBAC)
 *
 * Defines user roles, permissions, and access-checking utilities for the platform.
 * Roles are derived from wallet address (admin) or on-chain state (instructor).
 */

export type UserRole = 'learner' | 'instructor' | 'admin';

export interface Permission {
  /** View courses, lessons, leaderboard, community */
  viewContent: boolean;
  /** Enroll in courses, submit challenges, earn XP */
  learnContent: boolean;
  /** Create and edit own courses via /teach */
  createCourses: boolean;
  /** Publish courses (make visible to learners) */
  publishCourses: boolean;
  /** Access admin dashboard, manage users, moderate content */
  adminAccess: boolean;
  /** Manage platform config, rotate signers, sync CMS */
  systemConfig: boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  learner: {
    viewContent: true,
    learnContent: true,
    createCourses: false,
    publishCourses: false,
    adminAccess: false,
    systemConfig: false,
  },
  instructor: {
    viewContent: true,
    learnContent: true,
    createCourses: true,
    publishCourses: true,
    adminAccess: false,
    systemConfig: false,
  },
  admin: {
    viewContent: true,
    learnContent: true,
    createCourses: true,
    publishCourses: true,
    adminAccess: true,
    systemConfig: true,
  },
};

/** Wallets with admin privileges */
const ADMIN_WALLETS = new Set([
  '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', // demo admin
  'GpXHXs5KfzfXbNKcMLNbAMsJsgPsBE7y5GtwVoiuxYvH', // platform authority
]);

/** Wallets with instructor privileges (in production, fetched from on-chain state) */
const INSTRUCTOR_WALLETS = new Set<string>([
  // Populated from on-chain instructor registry or Sanity CMS
]);

/**
 * Determine the role of a wallet address.
 * Priority: admin > instructor > learner
 */
export function getUserRole(walletAddress: string | null | undefined): UserRole {
  if (!walletAddress) return 'learner';
  if (ADMIN_WALLETS.has(walletAddress)) return 'admin';
  if (INSTRUCTOR_WALLETS.has(walletAddress)) return 'instructor';
  return 'learner';
}

/** Get the permissions for a given role */
export function getPermissions(role: UserRole): Permission {
  return ROLE_PERMISSIONS[role];
}

/** Check if a wallet has a specific permission */
export function hasPermission(
  walletAddress: string | null | undefined,
  permission: keyof Permission,
): boolean {
  const role = getUserRole(walletAddress);
  return ROLE_PERMISSIONS[role][permission];
}

/** Check if a wallet is an admin */
export function isAdmin(walletAddress: string | null | undefined): boolean {
  return !!walletAddress && ADMIN_WALLETS.has(walletAddress);
}

/** Check if a wallet is an instructor */
export function isInstructor(walletAddress: string | null | undefined): boolean {
  if (!walletAddress) return false;
  return ADMIN_WALLETS.has(walletAddress) || INSTRUCTOR_WALLETS.has(walletAddress);
}
