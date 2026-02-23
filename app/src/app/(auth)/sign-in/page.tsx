"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Github, Wallet } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function SignInPage() {
  const t = useTranslations("Auth");

  return (
    <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(153,69,255,0.3),transparent_45%),radial-gradient(circle_at_85%_70%,rgba(20,241,149,0.2),transparent_40%)]" />
      <div className="relative grid min-h-[560px] md:grid-cols-[1fr_460px]">
        <section className="hidden p-10 md:block">
          <p className="inline-flex rounded-full border border-[#14F195]/30 bg-[#14F195]/10 px-3 py-1 text-xs text-[#14F195]">
            Solana-native access
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-zinc-100">Welcome back to Superteam Academy</h1>
          <p className="mt-3 max-w-md text-zinc-300">
            Continue your learning streak, complete challenge lessons, and mint your next credential.
          </p>
        </section>

        <section className="p-6 sm:p-8">
          <Card className="border-white/10 bg-zinc-950/70">
            <CardHeader>
              <CardTitle className="text-zinc-100">{t("welcomeBack")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black">
                <Wallet className="size-4" />
                Connect Solana Wallet
              </Button>

              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <div className="h-px flex-1 bg-white/10" />
                OR
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <Input type="email" placeholder={t("email")} className="bg-zinc-950/60" />
              <Input type="password" placeholder={t("password")} className="bg-zinc-950/60" />
              <Button className="w-full border border-white/10 bg-zinc-900 text-zinc-100">{t("submitSignIn")}</Button>

              <Button variant="outline" className="w-full justify-start border-white/20 bg-transparent text-zinc-200">
                <Github className="size-4" />
                Continue with GitHub
              </Button>
              <Button variant="outline" className="w-full justify-start border-white/20 bg-transparent text-zinc-200">
                <span className="inline-flex size-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black">
                  G
                </span>
                Continue with Google
              </Button>

              <p className="text-sm text-zinc-400">
                New to Superteam Academy?{" "}
                <Link href="/sign-up" className="text-[#14F195] hover:underline">
                  Create an account
                </Link>
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
