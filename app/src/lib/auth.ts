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
    async signIn({ user, account, profile, email, credentials }) {
      // Это User из JWT, а не из базы, если стратегия jwt
      const sessionUser = user as any; 
      
      // Сценарий: Вошли через кошелек, а теперь привязываем GitHub
      // `isNewUser` бывает неточным, поэтому проверяем наличие walletAddress
      // `account` существует только при OAuth
      if (account && sessionUser.walletAddress) {
        console.log("[Auth SignIn] Linking social account to existing wallet user...");
        
        // Находим юзера по кошельку
        const existingWalletUser = await prisma.user.findUnique({
          where: { walletAddress: sessionUser.walletAddress },
        });

        if (existingWalletUser) {
          // Находим OAuth аккаунт
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          });

          // Если аккаунт уже привязан к кому-то - ошибка.
          // Если нет - привязываем к нашему юзеру по кошельку.
          if (!existingAccount) {
            await prisma.account.create({
              data: {
                userId: existingWalletUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state as string | undefined,
              },
            });
          }
          
          // Обновляем данные профиля
          await prisma.user.update({
              where: { id: existingWalletUser.id },
              data: {
                name: existingWalletUser.name || (profile as any)?.name || (profile as any)?.login,
                email: existingWalletUser.email || (profile as any)?.email,
                image: existingWalletUser.image || (profile as any)?.avatar_url,
                githubHandle: (account.provider === 'github') ? (profile as any)?.login : existingWalletUser.githubHandle,
              },
          });

          // Возвращаем true, чтобы разрешить вход
          return true;
        }
      }

      // Сценарий: Первый вход через GitHub
      if (account?.provider === "github" && profile) {
         try {
            // @ts-ignore
            const githubLogin = profile.login || profile.name;
            if (user.email) {
                await prisma.user.update({
                    where: { email: user.email },
                    data: { githubHandle: githubLogin }
                });
            }
        } catch (e) {}
      }
      
      return true; // Разрешаем вход
    },
    async session({ session, token }) {
      if (session.user) {
        const userFromDb = await prisma.user.findUnique({ where: { id: token.sub } });
        // @ts-ignore
        session.user.id = token.sub;
        // @ts-ignore
        session.user.walletAddress = userFromDb?.walletAddress;
      }
      return session;
    },
    async jwt({ token, user, account, profile, trigger, session }) {
      if (user) {
        token.sub = user.id;
        // @ts-ignore
        token.walletAddress = user.walletAddress;
      }
      // Привязываем GitHub к существующей JWT сессии
      if (account && profile) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
        if (dbUser && account.provider === 'github') {
            await prisma.user.update({
                where: { id: dbUser.id },
                // @ts-ignore
                data: { githubHandle: profile.login }
            });
        }
      }
      return token;
    },
  },
  pages: {
    signIn: '/', 
  },
};