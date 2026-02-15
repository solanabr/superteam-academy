"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <footer className="border-t bg-background">
      {isLanding && (
        <div className="relative w-full overflow-hidden h-48 sm:h-64 lg:h-80">
          <Image
            src="/hero-banner.jpg"
            alt="Superteam Brasil"
            width={1280}
            height={400}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className={isLanding ? "grid grid-cols-2 gap-8 md:grid-cols-4" : "grid gap-10 md:grid-cols-[200px_1fr]"}>
          {!isLanding && (
            <div className="overflow-hidden rounded-xl self-start">
              <Image
                src="/hero-banner.jpg"
                alt="Superteam Brasil"
                width={400}
                height={260}
                className="w-full object-cover rounded-xl"
              />
            </div>
          )}

          <div className={isLanding ? "contents" : "grid grid-cols-2 gap-8 md:grid-cols-4"}>
            <div>
              <h3 className="text-sm font-semibold">Platform</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground">Courses</Link></li>
                <li><Link href="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground">Leaderboard</Link></li>
                <li><Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Learning Paths</h3>
              <ul className="mt-4 space-y-2">
                <li><span className="text-sm text-muted-foreground">Anchor Framework</span></li>
                <li><span className="text-sm text-muted-foreground">Rust for Solana</span></li>
                <li><span className="text-sm text-muted-foreground">DeFi Development</span></li>
                <li><span className="text-sm text-muted-foreground">Program Security</span></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Community</h3>
              <ul className="mt-4 space-y-2">
                <li><span className="text-sm text-muted-foreground">Discord</span></li>
                <li><span className="text-sm text-muted-foreground">Twitter</span></li>
                <li><span className="text-sm text-muted-foreground">GitHub</span></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Resources</h3>
              <ul className="mt-4 space-y-2">
                <li><span className="text-sm text-muted-foreground">Documentation</span></li>
                <li><span className="text-sm text-muted-foreground">Blog</span></li>
                <li><span className="text-sm text-muted-foreground">Changelog</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Built on Solana. Powered by Superteam.
          </p>
        </div>
      </div>
    </footer>
  );
}
