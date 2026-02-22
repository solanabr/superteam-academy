// app/src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import nacl from "tweetnacl";
import bs58 from "bs58";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
      profile(profile) {
        return {
          // УБИРАЕМ id: profile.id.toString(), чтобы Prisma сгенерировала ObjectID
          id: profile.id.toString(), // NextAuth требует id в возврате profile, НО адаптер его перезапишет правильным, если не форсировать в callbacks
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          // Кастомные поля передаем, но сохранять их будем в signIn callback
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    CredentialsProvider({
      name: "Solana",
      credentials: {
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" },
        publicKey: { label: "Public Key", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.message || !credentials?.signature || !credentials?.publicKey) {
            return null;
        }

        try {
            const message = new TextEncoder().encode(credentials.message);
            const signature = bs58.decode(credentials.signature);
            const publicKey = bs58.decode(credentials.publicKey);

            if (!nacl.sign.detached.verify(message, signature, publicKey)) {
                return null;
            }

            const walletAddress = credentials.publicKey;

            const user = await prisma.user.upsert({
                where: { walletAddress },
                update: { lastLogin: new Date() },
                create: {
                    walletAddress,
                    //username: walletAddress.slice(0, 6), // Временный ник
                    lastLogin: new Date(),
                }
            });

            return {
                id: user.id,
                walletAddress: user.walletAddress,
                name: user.username,
                image: user.image
            };

        } catch (e) {
            return null;
        }
      },
    }),
  ],
  callbacks: {
    // ВАЖНО: Исправляем signIn callback для сохранения githubHandle
    async signIn({ user, account, profile }) {
      if (account?.provider === "github" && profile) {
        try {
            // @ts-ignore
            const githubLogin = profile.login || profile.name;
            
            // На этом этапе user.id уже должен быть валидным ObjectID из базы
            // Но есть нюанс: при первом входе user.id может быть еще не создан адаптером в некоторых версиях flow.
            // Однако PrismaAdapter обычно создает юзера ДО вызова signIn (если это не credentials).
            
            // Чтобы избежать ошибки Malformed ObjectID, мы ищем юзера по email (который уникален)
            // или доверяем user.id, если он похож на MongoID.
            
            if (user.email) {
                await prisma.user.update({
                    where: { email: user.email },
                    data: { githubHandle: githubLogin }
                });
            }
        } catch (e) {
            console.error("Failed to save github handle", e);
            // Не блокируем вход, если не удалось сохранить хендл
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore
        session.user.id = token.sub; // sub хранит ID из базы
        // @ts-ignore
        session.user.walletAddress = token.walletAddress as string;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        // @ts-ignore
        token.walletAddress = user.walletAddress || (user as any).address;
      }
      if (trigger === "update" && session?.walletAddress) {
        token.walletAddress = session.walletAddress;
      }
      return token;
    },
  },
  pages: {
    signIn: '/', 
  },
};