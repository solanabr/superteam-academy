"use client";

import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { UserNav } from "@/components/user-nav";
import { LanguageSwitcher } from "@/components/language-switcher";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  const { connected } = useWallet();
  const { status } = useSession();
  const t = useTranslations("Landing");

  const isLoggedIn = connected || status === "authenticated";

  return (
    <div className="flex min-h-screen flex-col bg-[#050505] text-zinc-100">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <Image src="/icons/icon-192x192.png" alt="Superteam Academy Logo" width={32} height={32} className="rounded-md" />
            <span className="hidden bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-xl font-bold text-transparent md:inline-block">
              Superteam Academy
            </span>
            <span className="inline-block text-xl font-bold md:hidden">SA</span>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="hidden gap-6 text-sm font-medium md:flex">
              <Link href="/courses" className="text-foreground/70 transition-colors hover:text-foreground">
                {t("courses")}
              </Link>
              <Link href="#features" className="text-foreground/70 transition-colors hover:text-foreground">
                {t("features")}
              </Link>
            </nav>
            <div className="flex items-center gap-2">
              <ModeToggle />
              <LanguageSwitcher />
              {isLoggedIn ? (
                <Link href="/dashboard">
                  <Button className="border border-purple-400/40 bg-gradient-to-r from-purple-600 to-fuchsia-600 shadow-[0_0_30px_rgba(168,85,247,0.45)]">{t("goToDashboard")}</Button>
                </Link>
              ) : (
                <UserNav />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
      </main>

      <Footer />
    </div>
  );
}
