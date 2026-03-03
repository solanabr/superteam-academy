import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { createClient } from '@supabase/supabase-js'
import '@/lib/types/next-auth.d'

async function userExistsByEmail(email?: string | null): Promise<boolean> {
  if (!email) return false

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return false
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (error) return false
    return !!data
  } catch {
    return false
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async signIn({ user, account }) {
      // Store provider info in user object for later use
      if (user) {
        user.provider = account?.provider
      }
      return true
    },
    async jwt({ token, user, account, trigger, session }) {
      if (trigger === 'update' && session) {
        if (typeof session.needsProfile === 'boolean') {
          token.needsProfile = session.needsProfile
        }
      }

      if (user) {
        const userId = user.email || user.id
        const exists = await userExistsByEmail(user.email)

        Object.assign(token, {
          id: userId,
          name: user.name,
          email: user.email,
          image: user.image,
          provider: account?.provider,
          needsProfile: !exists,
        })
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? ''
        session.user.provider = token.provider
        session.user.needsProfile = Boolean(token.needsProfile)
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (url.startsWith(baseUrl)) return url
      return baseUrl
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
