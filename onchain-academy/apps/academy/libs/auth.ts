import { solanaAuth } from '@/libs/solana-auth-plugin'
import { syncUserToPayload } from '@/services/auth-sync.service'
import { betterAuth } from 'better-auth'
import { username } from 'better-auth/plugins'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  emailAndPassword: {
    enabled: false,
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  plugins: [username(), solanaAuth()],

  user: {
    additionalFields: {
      walletAddress: {
        type: 'string',
        required: false,
      },
      role: {
        type: 'string',
        required: false,
        defaultValue: 'learner',
      },
      onboardingComplete: {
        type: 'boolean',
        required: false,
        defaultValue: false,
      },
      bio: {
        type: 'string',
        required: false,
      },
      twitter: {
        type: 'string',
        required: false,
      },
      github: {
        type: 'string',
        required: false,
      },
      linkedin: {
        type: 'string',
        required: false,
      },
      telegram: {
        type: 'string',
        required: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await syncUserToPayload(
              user as Parameters<typeof syncUserToPayload>[0],
            )
          } catch (err) {
            console.error('[auth-sync] Failed to sync user to Payload:', err)
          }
        },
      },
      update: {
        after: async (user) => {
          try {
            await syncUserToPayload(
              user as Parameters<typeof syncUserToPayload>[0],
            )
          } catch (err) {
            console.error('[auth-sync] Failed to update user in Payload:', err)
          }
        },
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session
