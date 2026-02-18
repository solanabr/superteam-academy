export const ADMIN_WALLET = "DwN8jYP5aY6RJYKDkeTFS3Vf6EpZrxPQVm3uzdG8QXRX";

export type AdminRole = "admin" | "moderator";

export const ADMIN_ROLES: Record<string, AdminRole> = {
  [ADMIN_WALLET]: "admin",
  // Add moderator wallets here:
  // "ModeratorWalletBase58Address": "moderator",
};

/**
 * Role permissions:
 * - admin: full access (courses, users, roadmaps, settings)
 * - moderator: can manage courses and roadmaps, view users, no settings access
 */
export type AdminPermission =
  | "courses.read"
  | "courses.write"
  | "users.read"
  | "users.write"
  | "roadmaps.read"
  | "roadmaps.write"
  | "settings.read"
  | "settings.write"
  | "analytics.read";

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  admin: [
    "courses.read",
    "courses.write",
    "users.read",
    "users.write",
    "roadmaps.read",
    "roadmaps.write",
    "settings.read",
    "settings.write",
    "analytics.read",
  ],
  moderator: [
    "courses.read",
    "courses.write",
    "users.read",
    "roadmaps.read",
    "roadmaps.write",
    "analytics.read",
  ],
};

export function getRoleForWallet(wallet: string): AdminRole | null {
  return ADMIN_ROLES[wallet] ?? null;
}

export function hasPermission(
  role: AdminRole,
  permission: AdminPermission,
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getPermissions(role: AdminRole): AdminPermission[] {
  return ROLE_PERMISSIONS[role];
}
