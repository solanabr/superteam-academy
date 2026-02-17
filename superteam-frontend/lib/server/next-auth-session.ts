import NextAuth from "next-auth";
import { authConfig } from "@/lib/server/auth-config";
import type { Session } from "next-auth";

const { auth } = NextAuth(authConfig);

export async function getNextAuthSession(): Promise<Session | null> {
  try {
    return await auth();
  } catch {
    return null;
  }
}
