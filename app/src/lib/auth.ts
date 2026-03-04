import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/drizzle/db"
import {
  UserTable,
  AccountTable,
  SessionTable,
  VerificationTokenTable,
  WalletAddressTable,
} from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { authConfig } from "./auth.config"
import bcrypt from "bcryptjs"
import { PublicKey } from "@solana/web3.js"
import { verifyAsync } from "@noble/ed25519"
import bs58 from "bs58"
import { withDbRetry } from "@/lib/db-retry"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: UserTable as Parameters<typeof DrizzleAdapter>[1] extends { usersTable: infer T } ? T : never,
    accountsTable: AccountTable as Parameters<typeof DrizzleAdapter>[1] extends { accountsTable: infer T } ? T : never,
    sessionsTable: SessionTable as Parameters<typeof DrizzleAdapter>[1] extends { sessionsTable: infer T } ? T : never,
    verificationTokensTable: VerificationTokenTable as Parameters<typeof DrizzleAdapter>[1] extends { verificationTokensTable: infer T } ? T : never,
  }),
  session: { strategy: "jwt" },
  providers: [
    // Inherit Google + GitHub from authConfig
    ...authConfig.providers,

    // ── Email + Password ─────────────────────────────────────────────────
    Credentials({
      id: "email-password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const emailInput = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined
        if (!emailInput || !password) return null
        const email = emailInput.trim().toLowerCase()

        let user = null
        try {
          user = await withDbRetry(() =>
            db.query.UserTable.findFirst({
              where: eq(UserTable.email, email),
              columns: { id: true, email: true, name: true, image: true, password: true, emailVerified: true },
            })
          )
        } catch (error) {
          console.error("Email/password auth failed to read user", error)
          return null
        }

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return null

        return { id: user.id, email: user.email!, name: user.name, image: user.image }
      },
    }),

    // ── Email OTP ─────────────────────────────────────────────────────────
    // Used for: sign-up verification + passwordless sign-in
    // The OTP is verified server-side in /api/auth/send-otp before calling signIn("email-otp")
    Credentials({
      id: "email-otp",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" },
        // Optional fields for sign-up path
        name: { label: "Name", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const emailInput = credentials?.email as string | undefined
        const otp = credentials?.otp as string | undefined
        if (!emailInput || !otp) return null
        const email = emailInput.trim().toLowerCase()

        const otpIdentifier = `otp:${email}`
        const otpAttemptsIdentifier = `otp-attempts:${email}`

        // Verify OTP against the verificationTokens table
        let record = null
        try {
          record = await withDbRetry(() =>
            db.query.VerificationTokenTable.findFirst({
              where: eq(VerificationTokenTable.identifier, otpIdentifier),
            })
          )
        } catch (error) {
          console.error("Email OTP auth failed to load token", error)
          return null
        }

        if (!record) return null
        if (new Date(record.expires) < new Date()) {
          // Clean up expired token
          await db.delete(VerificationTokenTable).where(
            eq(VerificationTokenTable.identifier, otpIdentifier)
          )
          return null
        }

        let attemptsRecord = null
        try {
          attemptsRecord = await withDbRetry(() =>
            db.query.VerificationTokenTable.findFirst({
              where: eq(VerificationTokenTable.identifier, otpAttemptsIdentifier),
            })
          )
        } catch (error) {
          console.error("Email OTP auth failed to load attempts", error)
          return null
        }

        const attemptsExpired =
          attemptsRecord == null || new Date(attemptsRecord.expires) < new Date()
        const currentAttempts = attemptsExpired
          ? 0
          : Number.parseInt(attemptsRecord?.token ?? "0", 10) || 0

        if (currentAttempts >= 5) {
          return null
        }

        const otpValid = await bcrypt.compare(otp, record.token)
        if (!otpValid) {
          const nextAttempts = currentAttempts + 1

          await db
            .delete(VerificationTokenTable)
            .where(eq(VerificationTokenTable.identifier, otpAttemptsIdentifier))

          await db.insert(VerificationTokenTable).values({
            identifier: otpAttemptsIdentifier,
            token: String(nextAttempts),
            expires: record.expires,
          })

          return null
        }

        // Delete used OTP
        await db.delete(VerificationTokenTable).where(
          eq(VerificationTokenTable.identifier, otpIdentifier)
        )
        await db
          .delete(VerificationTokenTable)
          .where(eq(VerificationTokenTable.identifier, otpAttemptsIdentifier))

        // Find or create user
        let user = null
        try {
          user = await withDbRetry(() =>
            db.query.UserTable.findFirst({
              where: eq(UserTable.email, email),
            })
          )
        } catch (error) {
          console.error("Email OTP auth failed to read user", error)
          return null
        }

        if (!user) {
          // New user — create account
          const name = (credentials?.name as string | undefined) ?? email.split("@")[0] ?? "Learner"
          const rawPassword = credentials?.password as string | undefined
          const passwordHash = rawPassword ? await bcrypt.hash(rawPassword, 12) : null

          const baseUsername = name
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, "")
            .slice(0, 20)

          try {
            const [newUser] = await db
              .insert(UserTable)
              .values({
                name,
                email,
                emailVerified: new Date(),
                password: passwordHash,
                username: `${baseUsername}_${Math.random().toString(36).slice(2, 8)}`,
              })
              .returning()

            user = newUser
          } catch {
            const existing = await db.query.UserTable.findFirst({
              where: eq(UserTable.email, email),
            })
            if (!existing) return null
            user = existing
          }
        } else {
          // Mark email as verified if not already
          if (!user.emailVerified) {
            await db
              .update(UserTable)
              .set({ emailVerified: new Date() })
              .where(eq(UserTable.id, user.id))
          }
          // Optionally update password if provided and user doesn't have one
          const rawPassword = credentials?.password as string | undefined
          if (rawPassword && !user.password) {
            const passwordHash = await bcrypt.hash(rawPassword, 12)
            await db
              .update(UserTable)
              .set({ password: passwordHash })
              .where(eq(UserTable.id, user.id))
          }
        }

        return { id: user!.id, email: user!.email!, name: user!.name, image: user!.image }
      },
    }),

    // ── Wallet Sign-In ────────────────────────────────────────────────────
    // Verifies an Ed25519 signature over a nonce to authenticate a Solana wallet.
    // Creates a new account if no user exists for this wallet address.
    Credentials({
      id: "wallet-signin",
      credentials: {
        walletAddress: { label: "Wallet Address", type: "text" },
        signature: { label: "Signature", type: "text" }, // base58-encoded
        nonce: { label: "Nonce", type: "text" },
      },
      async authorize(credentials) {
        const walletAddress = credentials?.walletAddress as string | undefined
        const signature = credentials?.signature as string | undefined
        const nonce = credentials?.nonce as string | undefined

        if (!walletAddress || !signature || !nonce) return null

        // 1. Verify nonce exists in DB and hasn't expired
        const record = await db.query.VerificationTokenTable.findFirst({
          where: eq(VerificationTokenTable.identifier, `wallet-nonce:${walletAddress}`),
        })

        if (!record || new Date(record.expires) < new Date()) {
          if (record) {
            await db
              .delete(VerificationTokenTable)
              .where(eq(VerificationTokenTable.identifier, `wallet-nonce:${walletAddress}`))
          }
          return null
        }

        if (record.token !== nonce) return null

        // 2. Verify Ed25519 signature
        try {
          const publicKey = new PublicKey(walletAddress)
          const message = new TextEncoder().encode(
            `Sign in to Superteam Brazil Academy\n\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction or cost any fees.`
          )
          const signatureBytes = bs58.decode(signature)
          const isValid = await verifyAsync(signatureBytes, message, publicKey.toBytes())
          if (!isValid) return null
        } catch {
          return null
        }

        // 3. Consume the nonce
        await db
          .delete(VerificationTokenTable)
          .where(eq(VerificationTokenTable.identifier, `wallet-nonce:${walletAddress}`))

        // 4. Find user by global wallet mapping
        let user = await db.query.UserTable.findFirst({
          where: eq(UserTable.walletAddress, walletAddress),
        })
        if (!user) {
          const mappedWallet = await db.query.WalletAddressTable.findFirst({
            where: eq(WalletAddressTable.address, walletAddress),
            columns: { userId: true },
          })

          if (mappedWallet?.userId) {
            user = await db.query.UserTable.findFirst({
              where: eq(UserTable.id, mappedWallet.userId),
            })
          }
        }

        const defaultWalletName = `Wallet ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`

        if (!user) {
          const shortAddr = walletAddress.slice(0, 6).toLowerCase()
          user = await db.transaction(async (tx) => {
            const inserted = await tx
              .insert(UserTable)
              .values({
                name: defaultWalletName,
                walletAddress,
                username: `sol_${shortAddr}_${Math.random().toString(36).slice(2, 6)}`,
                emailVerified: new Date(),
              })
              .returning()
            const newUser = inserted[0]
            if (!newUser) return undefined

            await tx.insert(WalletAddressTable).values({
              userId: newUser.id,
              address: walletAddress,
              isPrimary: true,
              verifiedAt: new Date(),
            })

            return newUser
          })
        } else if (!user.name?.trim()) {
          const [updated] = await db
            .update(UserTable)
            .set({ name: defaultWalletName })
            .where(eq(UserTable.id, user.id))
            .returning()
          user = updated ?? user
        }
        if (!user) return null

        // Keep global wallet address and linked wallet mapping in sync for existing users.
        if (user.walletAddress !== walletAddress) {
          await db
            .update(UserTable)
            .set({ walletAddress })
            .where(eq(UserTable.id, user.id))
        }

        await db
          .update(WalletAddressTable)
          .set({ isPrimary: false })
          .where(eq(WalletAddressTable.userId, user.id))

        const existingLink = await db.query.WalletAddressTable.findFirst({
          where: eq(WalletAddressTable.address, walletAddress),
          columns: { id: true, userId: true },
        })

        if (!existingLink) {
          await db.insert(WalletAddressTable).values({
            userId: user.id,
            address: walletAddress,
            isPrimary: true,
            verifiedAt: new Date(),
          })
        } else if (existingLink.userId === user.id) {
          await db
            .update(WalletAddressTable)
            .set({ isPrimary: true, verifiedAt: new Date() })
            .where(eq(WalletAddressTable.id, existingLink.id))
        }

        return {
          id: user.id,
          email: user.email ?? null,
          name: user.name ?? defaultWalletName,
          image: user.image ?? null,
        }
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      if (user?.id) {
        token.id = user.id
        if (account?.provider) {
          token.authProvider = account.provider
        }
      }

      // Keep role/xp/username fresh in JWT so middleware auth reflects DB changes
      // (e.g. promoting a user to admin without forcing a re-login).
      const userId = (user?.id ?? token.sub) as string | undefined
      if (userId) {
        const dbUser = await db.query.UserTable.findFirst({
          where: eq(UserTable.id, userId),
          columns: { role: true, username: true, xp: true, walletAddress: true },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.username = dbUser.username ?? undefined
          token.xp = dbUser.xp
          token.walletAddress = dbUser.walletAddress ?? undefined
        }
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.sub!
      session.user.role = token.role as string | undefined
      session.user.username = token.username as string | undefined
      session.user.xp = token.xp as number | undefined
      session.user.authProvider = token.authProvider as string | undefined
      session.user.walletAddress = token.walletAddress as string | undefined
      return session
    },
  },

  events: {
    async createUser({ user }) {
      if (user.id && user.name && !user.name.includes("_")) {
        const baseUsername = user.name
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "")
          .slice(0, 20)
        const username = `${baseUsername}_${user.id.slice(0, 6)}`
        await db
          .update(UserTable)
          .set({ username })
          .where(eq(UserTable.id, user.id))
      }
    },
  },
})

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      username?: string
      xp?: number
      authProvider?: string
      walletAddress?: string
    }
  }
  interface JWT {
    role?: string
    username?: string
    xp?: number
    authProvider?: string
    walletAddress?: string
  }
}
