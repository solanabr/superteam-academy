import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// Google OAuth is optional — the app works without it.
// Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and NEXTAUTH_SECRET to enable.
const hasGoogle =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

export const authOptions: NextAuthOptions = {
  providers: hasGoogle
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      ]
    : [],
  secret: process.env.NEXTAUTH_SECRET ?? 'dev-secret-not-for-production',
  pages: {
    signIn: undefined, // use default modal
  },
  callbacks: {
    async session({ session, token }) {
      return { ...session, token };
    },
  },
};

export default NextAuth(authOptions);
