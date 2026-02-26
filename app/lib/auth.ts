import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';

// Google + GitHub OAuth are optional — the app works without them.
// Set the corresponding env vars to enable each provider.
const hasGoogle =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
const hasGithub =
  !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;

const providers = [
  ...(hasGoogle
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      ]
    : []),
  ...(hasGithub
    ? [
        GithubProvider({
          clientId: process.env.GITHUB_CLIENT_ID!,
          clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
      ]
    : []),
];

export const authOptions: NextAuthOptions = {
  providers,
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
