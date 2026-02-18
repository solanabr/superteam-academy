import "server-only";

import { redirect } from "next/navigation";
import {
  getAuthenticatedUser,
  type AuthenticatedUser,
} from "@/lib/server/auth-adapter";
import {
  getRoleForWallet,
  hasPermission,
  type AdminRole,
  type AdminPermission,
} from "@/lib/admin-constants";

export { type AdminRole, type AdminPermission } from "@/lib/admin-constants";

export function getAdminRole(user: AuthenticatedUser): AdminRole | null {
  return getRoleForWallet(user.walletAddress);
}

export function isAdmin(user: AuthenticatedUser): boolean {
  return getAdminRole(user) !== null;
}

/**
 * For Server Components — redirects on failure.
 */
export async function requireAdminUser(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user || !isAdmin(user)) {
    redirect("/");
  }
  return user;
}

/**
 * For Route Handlers — returns null on failure (no redirect).
 * Caller should return NextResponse.json({ error }, { status: 401/403 }).
 */
export async function getAdminUserForApi(): Promise<AuthenticatedUser | null> {
  const user = await getAuthenticatedUser();
  if (!user || !isAdmin(user)) return null;
  return user;
}

/**
 * For Route Handlers — returns null if permission denied.
 */
export async function checkPermission(
  permission: AdminPermission,
): Promise<AuthenticatedUser | null> {
  const user = await getAdminUserForApi();
  if (!user) return null;
  const role = getAdminRole(user);
  if (!role || !hasPermission(role, permission)) return null;
  return user;
}

/**
 * For Server Components — redirects on failure.
 */
export async function requirePermission(
  permission: AdminPermission,
): Promise<AuthenticatedUser> {
  const user = await requireAdminUser();
  const role = getAdminRole(user);
  if (!role || !hasPermission(role, permission)) {
    redirect("/admin");
  }
  return user;
}
