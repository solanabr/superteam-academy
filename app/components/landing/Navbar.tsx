"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { useIsAdmin } from "@/hooks";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const NAV_LINKS = [
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Challenges", href: "/challenges" },
];

const COURSES = [
  {
    title: "Solana Fundamentals",
    description: "",
    level: "Beginner",
    href: "/courses/solana-fundamentals",
  },
  {
    title: "Anchor Program Development",
    description: "",
    level: "Beginner",
    href: "/courses/anchor-development",
  },
  {
    title: "Token Extensions",
    description: "",
    level: "Advanced",
    href: "/courses/token-extensions",
  },
  {
    title: "Metaplex Core NFTs",
    description: "",
    level: "Advanced",
    href: "/courses/defi",
  },
];

const LANGUAGES = [
  { code: "EN", label: "English" },
  { code: "PT-BR", label: "Português" },
  { code: "ES", label: "Español" },
] as const;

export function Navbar() {
  const { isAdmin } = useIsAdmin();
  const [lang, setLang] = useState("EN");
  const activeLang = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Floating navbar */}
      <div className="relative flex justify-center pt-4">
        <div className="w-[95%] md:w-[90%] lg:w-[85%] max-w-7xl
                    rounded-2xl border border-white/10
                    bg-background/70 backdrop-blur-md shadow-lg">
          <div className="px-6 py-4 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <p className="font-game font-bold text-2xl">
                Superteam-academy
              </p>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8 ">
              <NavigationMenu>
                <NavigationMenuList className="gap-4">
                  {/* Courses dropdown */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="font-game text-xl">
                      Courses
                    </NavigationMenuTrigger>

                    <NavigationMenuContent>
                      <ul className="grid grid-cols-2 gap-3 p-4 w-[520px]">
                        {COURSES.map((course) => (
                          <li key={course.href}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={course.href}
                                className="block rounded-md p-3 hover:bg-accent transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <h4 className="font-game text-xl">
                                    {course.title}
                                  </h4>
                                  <span className="text-xs text-yellow-400 font-game">
                                    {course.level}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {course.description}
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {/* Normal links */}
                  {NAV_LINKS.map((link) => (
                    <NavigationMenuItem key={link.href}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={link.href}
                          className="font-game text-xl hover:text-yellow-400 transition-colors"
                        >
                          {link.label}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}

                  {/* Language selector */}
                  {/* Language selector — own NavigationMenu so content anchors correctly */}
                  <NavigationMenu>
                    <NavigationMenuList>
                      <NavigationMenuItem>
                        <NavigationMenuTrigger className="font-game text-xl">
                          {activeLang.code}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className="flex flex-col gap-1 p-2 w-[180px]">
                            {LANGUAGES.map((l) => (
                              <li key={l.code}>
                                <button
                                  onClick={() => setLang(l.code)}
                                  className={`w-full flex items-center gap-3 rounded-lg px-4 py-2.5 font-game text-lg text-left transition-colors
                  ${lang === l.code
                                      ? "bg-yellow-400/10 text-yellow-400"
                                      : "hover:bg-accent"
                                    }`}
                                >
                                  {l.label}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    </NavigationMenuList>
                  </NavigationMenu>

                  {isAdmin && (
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/admin"
                          className="font-game text-xl hover:text-yellow-400 transition-colors"
                        >
                          Admin
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  )}
                </NavigationMenuList>
              </NavigationMenu>
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}