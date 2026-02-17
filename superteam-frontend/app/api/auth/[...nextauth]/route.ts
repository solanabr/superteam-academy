import NextAuth from "next-auth";
import { authConfig } from "@/lib/server/auth-config";

const { handlers } = NextAuth(authConfig);

export const { GET, POST } = handlers;
