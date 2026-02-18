import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [Google],
    callbacks: {
        async jwt({ token, account }) {
            if (account && account.id_token) {
                token.id_token = account.id_token;
            }
            return token;
        },
        async session({ session, token }) {
            if (token.id_token) {
                // @ts-expect-error - id_token is not in default session type
                session.id_token = token.id_token as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth",
    },
})
