"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";

const NAV_LINKS = [
  { label: "Courses", href: "/courses" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Settings", href: "/settings" },
];

export function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md"
    >
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Link href="/" className="shrink-0" aria-label="Home">
            <Image
              src="/HORIZONTAL-LOGO/ST-DARK-GREEN-HORIZONTAL.png"
              alt="Superteam Academy"
              width={160}
              height={36}
              className="h-7 w-auto"
              priority
            />
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-primary/5 hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden sm:block">
          <WalletConnectButton />
        </div>
      </nav>
    </motion.header>
  );
}

