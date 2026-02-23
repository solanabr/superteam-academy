"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Github, Wallet } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function SignUpPage() {
  const t = useTranslations("Auth");

  return (
    <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border bg-card">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(153,69,255,0.3),transparent_45%),radial-gradient(circle_at_85%_70%,rgba(255,210,63,0.2),transparent_40%)]" />
      <div className="relative grid min-h-[600px] md:grid-cols-[1fr_460px]">
        <section className="hidden p-10 md:block">
          <p className="inline-flex rounded-full border border-[#2f6b3f]/35 bg-[#2f6b3f]/15 px-3 py-1 text-xs text-[#f7eacb]">
            Builder onboarding
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-foreground">Create your Superteam Academy account</h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            Start with wallet-native identity, enroll in learning tracks, and earn on-chain credentials.
          </p>
        </section>

        <section className="p-6 sm:p-8">
          <Card className="border-border bg-st-dark/70">
            <CardHeader>
              <CardTitle className="text-foreground">{t("createAccount")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full bg-gradient-to-r from-[#2f6b3f] to-[#ffd23f] text-st-dark">
                <Wallet className="size-4" />
                Connect Solana Wallet
              </Button>

              <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                <div className="h-px flex-1 bg-white/10" />
                OR
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <Input placeholder={t("username")} className="bg-st-dark/60" />
              <Input type="email" placeholder={t("email")} className="bg-st-dark/60" />
              <Input type="password" placeholder={t("password")} className="bg-st-dark/60" />
              <Input type="password" placeholder="Confirm password" className="bg-st-dark/60" />

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" className="size-4 rounded border-border bg-card" />
                I agree to the terms and privacy policy.
              </label>

              <Button className="w-full border border-border bg-card text-foreground">{t("submitSignUp")}</Button>

              <Button variant="outline" className="w-full justify-start border-border bg-transparent text-foreground/90">
                <Github className="size-4" />
                Continue with GitHub
              </Button>
              <Button variant="outline" className="w-full justify-start border-border bg-transparent text-foreground/90">
                <span className="inline-flex size-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-st-dark">
                  G
                </span>
                Continue with Google
              </Button>

              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-[#ffd23f] hover:underline">
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
