import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

// Middleware uses only the Edge-safe config (no DB adapter, no Node.js modules).
// Role is read from the JWT token that was encoded at sign-in time.
export default NextAuth(authConfig).auth

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
