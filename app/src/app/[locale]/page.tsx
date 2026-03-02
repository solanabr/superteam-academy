// app/src/app/[locale]/page.tsx
"use client";

import { useEffect } from "react";
// Добавляем импорт useTranslations
import { useLocale, useTranslations } from "next-intl"; 
import { useRouter } from "@/i18n/navigation";
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
  const router = useRouter();
  const locale = useLocale();
  
  // 1. Инициализируем хук переводов для неймспейса Navigation
  const t = useTranslations('Landing'); 

  const isLoggedIn = connected || status === "authenticated";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <Image 
                src="/icons/icon-192x192.png" 
                alt="Superteam Academy Logo" 
                width={32} 
                height={32} 
                className="rounded-md"
              />
              <span className="hidden md:inline-block font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                Superteam Academy
              </span>
              <span className="inline-block font-bold text-xl md:hidden">
                SA
              </span>
            </Link>
            
            <div className="flex items-center gap-4">
                <nav className="hidden md:flex gap-6 text-sm font-medium">
                    {/* 2. ЗАМЕНЯЕМ ХАРДКОД НА t('ключ') */}
                    <Link href="/courses" className="transition-colors hover:text-foreground/80 text-foreground/60">
                        {t('courses')}
                    </Link>
                    <Link href="#features" className="transition-colors hover:text-foreground/80 text-foreground/60">
                        {t('features')}
                    </Link>
                </nav>
                <div className="flex items-center gap-2">
                    
                    <ModeToggle />
                    <LanguageSwitcher />
                    {isLoggedIn ? (
                        <Link href="/dashboard">
                            <Button>Go to Dashboard</Button>
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