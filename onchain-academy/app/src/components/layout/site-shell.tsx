"use client";

import type { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";

export function SiteShell({ children }: PropsWithChildren): React.JSX.Element {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--fg-primary)]">
      <Header />
      <main
        className={
          isHome
            ? "w-full"
            : "mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
        }
      >
        {children}
      </main>
      <OnboardingGate />
      <Footer />
    </div>
  );
}
