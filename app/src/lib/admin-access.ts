interface AdminIdentity {
  id?: string | null;
  email?: string | null;
}

function parseAdminUserIds(): string[] {
  return (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function hasAdminAllowlist(): boolean {
  return parseAdminUserIds().length > 0 || parseAdminEmails().length > 0;
}

export function isAllowlistedAdmin(identity: AdminIdentity): boolean {
  const adminUserIds = parseAdminUserIds();
  const adminEmails = parseAdminEmails();

  const userId = identity.id?.trim();
  const email = identity.email?.trim().toLowerCase();

  return (!!userId && adminUserIds.includes(userId)) || (!!email && adminEmails.includes(email));
}
