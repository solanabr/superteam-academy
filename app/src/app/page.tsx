// app/src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useAuthWallet } from "@/hooks/useAuthWallet";

const WalletButton = dynamic(() => import("@/components/WalletButton"), { ssr: false });

export default function LandingPage() {
  const { connected } = useWallet();
  const { status } = useSession();
  const router = useRouter();
  const { login } = useAuthWallet(); // Наш новый хук

  // Редирект, если уже залогинен в NextAuth
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="h-screen flex justify-center items-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.02] -z-10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px] -z-10" />

      <Card className="w-full max-w-md border-muted/40 shadow-2xl backdrop-blur-sm bg-background/80">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Superteam Academy
          </CardTitle>
          <p className="text-muted-foreground">
            Master Solana development with interactive courses and on-chain rewards.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            
            <div className="p-4 border rounded-lg bg-muted/20 text-center">
              <h3 className="font-semibold mb-2">Login with Wallet</h3>
              <div className="flex flex-col items-center gap-2">
                
                {/* 1. Если кошелек не подключен к браузеру - кнопка адаптера */}
                {!connected && <WalletButton />}

                {/* 2. Если подключен, но не залогинен в приложении - кнопка подписи */}
                {connected && status === "unauthenticated" && (
                    <Button onClick={login} className="w-full">
                        Sign In with Wallet
                    </Button>
                )}
                
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or sign in with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => signIn('github')} className="gap-2">
                <FaGithub /> GitHub
              </Button>
              <Button variant="outline" onClick={() => signIn('google')} className="gap-2">
                <FaGoogle /> Google
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}