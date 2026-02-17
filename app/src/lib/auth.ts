import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/", // redirect to home page (modal will handle sign in)
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.provider = account.provider;
      }
      if (profile) {
        // GitHub provides `login` and `avatar_url` as non-standard Profile fields
        const p = profile as Record<string, unknown>;
        token.name =
          (typeof p.name === "string" ? p.name : null) ||
          (typeof p.login === "string" ? p.login : null) ||
          token.name;
        token.picture =
          (typeof p.image === "string" ? p.image : null) ||
          (typeof p.avatar_url === "string" ? p.avatar_url : null) ||
          token.picture;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as Record<string, unknown>).provider = token.provider;
        (session.user as unknown as Record<string, unknown>).id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
