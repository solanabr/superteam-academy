"use client";

import Image from "next/image";
import Link from "next/link";

const LINK_COLUMNS = [
    {
        title: "Learn",
        links: [
            { label: "All Courses", href: "/courses" },
            { label: "Learning Tracks", href: "/tracks" },
            { label: "Certifications", href: "/certifications" },
        ],
    },
    {
        title: "Community",
        links: [
            { label: "Blog", href: "/blog" },
            { label: "Discord", href: "https://discord.gg/superteam" },
            { label: "Events", href: "/events" },
        ],
    },
    {
        title: "Resources",
        links: [
            { label: "Documentation", href: "/docs" },
            { label: "API Reference", href: "/api" },
            { label: "Open Source", href: "https://github.com/superteam" },
        ],
    },
];

export function Footer() {
    return (
        <footer className="w-full border-t border-border bg-background">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
                <div className="grid gap-8 sm:gap-10 grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
                    {/* Brand column — horizontal logo + Superteam */}
                    <div className="max-w-xs">
                        <div className="flex items-center gap-2 mb-4">
                            <Image
                                src="/HORIZONTAL-LOGO/ST-DARK-GREEN-HORIZONTAL.png"
                                alt="Superteam Academy"
                                width={160}
                                height={36}
                                className="h-10 w-auto object-contain dark:hidden"
                            />
                            <Image
                                src="/HORIZONTAL-LOGO/ST-OFF-WHITE-HORIZONTAL.png"
                                alt="Superteam Academy"
                                width={160}
                                height={36}
                                className="h-10 w-auto object-contain hidden dark:block"
                            />
                        </div>
                        <p className="font-game text-lg text-muted-foreground">
                            The academy for Solana developers. Master on-chain programming
                            with hands-on courses and real-world projects.
                        </p>
                    </div>

                    {/* Link columns */}
                    {LINK_COLUMNS.map((col) => (
                        <div key={col.title}>
                            <h4 className="mb-4 font-game text-xl text-yellow-400">
                                {col.title}
                            </h4>
                            <ul className="flex flex-col gap-2.5">
                                {col.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="font-game text-lg text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Copyright bar */}
            <div className="border-t border-border">
                <div className="mx-auto flex max-w-7xl flex-col-reverse sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4">
                    <p className="font-game text-sm text-muted-foreground text-center sm:text-left">
                        &copy; {new Date().getFullYear()} Superteam Academy
                    </p>
                    <div className="flex gap-4">
                        <Link href="/privacy" className="font-game text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Privacy
                        </Link>
                        <Link href="/terms" className="font-game text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Terms
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
