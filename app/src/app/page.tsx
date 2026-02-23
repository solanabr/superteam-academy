// app/src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { UserNav } from "@/components/user-nav";
import Link from "next/link";

export default function LandingPage() {
  const { connected } = useWallet();
  const { status } = useSession();
  const router = useRouter();

  // Если пользователь вошел, редиректим его в дашборд
  // НО: Иногда полезно дать возможность посмотреть лендинг залогиненным.
  // Давай пока оставим редирект, как было, или уберем его, если хочешь.
  // По ТЗ лендинг должен быть доступен всем.
  // Давай уберем авто-редирект, пусть пользователь сам жмет "Go to Dashboard"
  
  const isLoggedIn = connected || status === "authenticated";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Public Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
            <div className="font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                Superteam Academy
            </div>
            
            <div className="flex items-center gap-4">
                <nav className="hidden md:flex gap-6 text-sm font-medium">
                    <Link href="/courses" className="transition-colors hover:text-foreground/80 text-foreground/60">Courses</Link>
                    <Link href="#features" className="transition-colors hover:text-foreground/80 text-foreground/60">Features</Link>
                </nav>
                <div className="flex items-center gap-2">
                    <ModeToggle />
                    {isLoggedIn ? (
                        <Link href="/dashboard">
                            <Button>Go to Dashboard</Button>
                        </Link>
                    ) : (
                        <UserNav /> // Наша кнопка Sign In
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