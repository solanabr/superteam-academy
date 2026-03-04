import type { DefaultSession } from 'next-auth'

/**
 * NextAuth module augmentation
 * Extends the default session/JWT types to include custom fields
 * used for user identification and profile completion flow
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      provider?: string
      needsProfile?: boolean
      walletAddress?: string | null
    } & DefaultSession['user']
  }

  interface User {
    provider?: string
    walletAddress?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    provider?: string
    needsProfile?: boolean
    walletAddress?: string | null
  }
}
