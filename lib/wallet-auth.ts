export const WALLET_AUTH_MESSAGE = 'Superteam Academy wallet auth v1'

export function walletToEmail(walletAddress: string): string {
  // Build a deterministic, RFC-safe local part (<=64 chars), prefixed with a letter.
  // This avoids validator edge-cases with long/raw wallet strings.
  const normalized = String(walletAddress || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  const local = `w${normalized.slice(0, 30)}${normalized.slice(-20)}`.slice(0, 64)
  return `${local}@superteamacademy.app`
}

export function signatureToPassword(signature: Uint8Array): string {
  // Supabase password hashing (bcrypt) rejects values longer than 72 chars.
  // Use a deterministic 32-byte prefix of the signature => 64 hex chars + prefix.
  const hex = Array.from(signature.slice(0, 32))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `wa_${hex}`
}

export function isInvalidCredentialsError(message: string): boolean {
  const m = message.toLowerCase()
  return m.includes('invalid login credentials') || m.includes('invalid credentials')
}
