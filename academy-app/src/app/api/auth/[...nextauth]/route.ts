import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { userService } from "~/services/user.service";
import { cookies } from "next/headers";

export const authOptions: NextAuthOptions = {
   providers: [
      GithubProvider({
         clientId: process.env.GITHUB_ID ?? "",
         clientSecret: process.env.GITHUB_SECRET ?? "",
      }),
      GoogleProvider({
         clientId: process.env.GOOGLE_ID ?? "",
         clientSecret: process.env.GOOGLE_SECRET ?? "",
      }),
   ],
   callbacks: {
      async signIn({ user, account, profile }) {
         if (account?.provider === "google" || account?.provider === "github") {
            try {
               if (!user.email) return false;

               // Use our UserService to find or create this user in MongoDB
               let githubUsername: string | undefined;
               if (account?.provider === "github") {
                  const githubProfile = profile as any;
                  githubUsername = githubProfile.login;
               }

               // Look for the custom token we set in AuthModal before redirecting
               const reqCookies = await cookies();
               const tempToken = reqCookies.get('temp_auth_token')?.value;

               const result = await userService.handleOAuthLogin(
                  user.email,
                  user.name || undefined,
                  user.image || undefined,
                  githubUsername,
                  tempToken
               );

               // Attach the internal DB ID to the user object for the jwt callback
               user.id = result.user.id;

               // Let's pass the real token back so the client can save it
               // @ts-ignore
               user.customToken = result.token;

               // Clear the temp cookie so it doesn't linger
               reqCookies.set('temp_auth_token', '', { maxAge: 0, path: '/' });

               return true;
            } catch (error) {
               console.error("Error during OAuth login mapping:", error);
               return false;
            }
         }
         return true;
      },
      async jwt({ token, user, trigger, session }) {
         // Initial sign in
         if (user) {
            token.sub = user.id; // Store the internal DB user ID
            // @ts-ignore
            token.isNewUser = user.isNewUser;
            // @ts-ignore
            token.customToken = user.customToken;
         }
         return token;
      },
      async session({ session, token }) {
         if (session.user) {
            // Propagate the internal DB ID into the client session
            // @ts-ignore - Need to augment the NextAuth Session types
            session.user.id = token.sub as string;
            // @ts-ignore
            session.user.isNewUser = token.isNewUser as boolean;
            // @ts-ignore
            session.user.customToken = token.customToken as string;
         }
         return session;
      },
   },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
