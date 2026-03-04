import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"

const publicPrefixes = [
  "/sign-in",
  "/sign-up",
  "/api/auth",
  "/courses",
  "/leaderboard",
  "/certificates",
]

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true
  return publicPrefixes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export const authConfig = {
  providers: [
    Google({ allowDangerousEmailAccountLinking: true }),
    GitHub({ allowDangerousEmailAccountLinking: true }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const { pathname } = nextUrl

      if (pathname.startsWith("/admin")) {
        if (!auth) return Response.redirect(new URL("/sign-in", nextUrl))
        return true
      }

      if (!isPublicRoute(pathname) && !auth) {
        return Response.redirect(new URL("/sign-in", nextUrl))
      }

      return true
    },
  },
} satisfies NextAuthConfig
