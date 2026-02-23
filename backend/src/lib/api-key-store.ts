import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export type ApiKeyRole = "admin" | "client";

export type StoredKey = {
  keyHash: string;
  role: ApiKeyRole;
  label?: string;
  createdAt: string;
};

const keys = new Map<string, StoredKey>();

function hashKey(key: string): string {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

export function addKey(
  plainKey: string,
  role: ApiKeyRole,
  label?: string
): void {
  const keyHash = hashKey(plainKey);
  keys.set(keyHash, {
    keyHash,
    role,
    label: label ?? undefined,
    createdAt: new Date().toISOString(),
  });
}

export function isKeyValid(plainKey: string): boolean {
  const keyHash = hashKey(plainKey);
  return keys.has(keyHash);
}

export function tokenMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function getStoredKeys(): StoredKey[] {
  return Array.from(keys.values());
}

export function generateApiKey(): string {
  return "sk_" + randomBytes(32).toString("base64url");
}
