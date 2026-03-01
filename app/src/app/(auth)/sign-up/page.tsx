"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSiwsAuth } from "@/hooks/use-siws-auth";
import { useUserStore } from "@/lib/store/user-store";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Loader2, ShieldCheck, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { signIn as nextAuthSignIn } from "next-auth/react";

export default function SignUpPage() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const { signIn, signing } = useSiwsAuth();
  const setWalletAddress = useUserStore((state) => state.setWalletAddress);

  const handleSignUp = async () => {
    const payload = await signIn();
    if (!payload) return;

    setWalletAddress(payload.walletAddress);

    const result = await nextAuthSignIn("solana", {
      redirect: false,
      walletAddress: payload.walletAddress,
      signature: payload.signature,
      nonce: payload.nonce,
      message: payload.message,
    });

    if (result?.ok) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border bg-card">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="relative grid min-h-[560px] md:grid-cols-[1fr_460px]">
        <section className="hidden p-10 md:block">
          <p className="inline-flex rounded-full border border-primary/35 bg-primary/15 px-3 py-1 text-xs text-foreground">
            Builder onboarding
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-foreground">
            Create your Superteam Academy account
          </h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            Start with wallet-native identity, enroll in learning tracks, and earn on-chain credentials.
          </p>
          <div className="mt-8 space-y-3">
            <Feature text="Connect your Solana wallet — no username or password needed" />
            <Feature text="Progress is tracked on-chain as soulbound XP tokens" />
            <Feature text="Earn Metaplex Core credential NFTs on course completion" />
          </div>
        </section>

        <section className="flex items-center p-6 sm:p-8">
          <Card className="w-full border-border bg-surface">
            <CardHeader>
              <CardTitle className="text-foreground">{t("createAccount")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!connected ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Connect your Solana wallet to create an account.
                  </p>
                  <WalletMultiButton className="w-full! rounded-lg! bg-gradient-cta! px-6! py-2! text-cta-foreground! justify-center!" />
                </>
              ) : (
                <>
                  <div className="rounded-lg border border-border bg-secondary/50 p-3 text-sm">
                    <p className="text-muted-foreground">Connected wallet</p>
                    <p className="mt-1 break-all font-mono text-xs text-foreground/80">
                      {publicKey?.toBase58()}
                    </p>
                  </div>

                  <Button
                    className="w-full bg-gradient-cta text-cta-foreground"
                    disabled={signing}
                    onClick={() => void handleSignUp()}
                  >
                    {signing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Wallet className="size-4" />
                    )}
                    {signing ? "Creating account..." : "Sign up with Solana"}
                  </Button>
                </>
              )}

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                variant="outline"
                className="w-full border-border bg-transparent text-foreground"
                onClick={() => void nextAuthSignIn("google", { callbackUrl: "/dashboard" })}
              >
                <svg className="mr-2 size-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Sign up with Google
              </Button>

              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-highlight hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-muted-foreground">
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-highlight" />
      <span>{text}</span>
    </div>
  );
}
