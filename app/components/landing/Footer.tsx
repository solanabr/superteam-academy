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
            { label: "Contributors", href: "/contributors" },
        ],
    },
    {
        title: "Resources",
        links: [
            { label: "Documentation", href: "/docs" },
            { label: "API Reference", href: "/api" },
            { label: "Open Source", href: "https://github.com/superteam" },
            { label: "Status", href: "/status" },
        ],
    },
];

const SOCIAL_LINKS = [
    {
        label: "X (Twitter)",
        href: "https://x.com/superteam",
        icon: (
            <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
    },
    {
        label: "Discord",
        href: "https://discord.gg/superteam",
        icon: (
            <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
        ),
    },
    {
        label: "GitHub",
        href: "https://github.com/superteam",
        icon: (
            <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
        ),
    },
    {
        label: "YouTube",
        href: "https://youtube.com/@superteam",
        icon: (
            <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
        ),
    },
];

export function Footer() {
    return (
        <footer className="w-full border-t border-border bg-primary text-primary-foreground">
            <div className="mx-auto max-w-7xl px-6 py-12">
                <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
                    {/* Brand column */}
                    <div className="max-w-xs">
                        <Image
                            src="/HORIZONTAL-LOGO/ST-OFF-WHITE-HORIZONTAL.png"
                            alt="Superteam Academy"
                            width={160}
                            height={36}
                            className="mb-4 h-7 w-auto"
                        />
                        <p className="mb-6 text-sm leading-relaxed text-primary-foreground/70">
                            The most advanced learning platform for Solana developers. Master
                            on-chain programming with hands-on courses and real-world
                            projects.
                        </p>
                        <div className="flex gap-3">
                            {SOCIAL_LINKS.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.label}
                                    className="flex size-8 items-center justify-center rounded-md text-primary-foreground/60 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    {LINK_COLUMNS.map((col) => (
                        <div key={col.title}>
                            <h4 className="mb-4 text-sm font-semibold text-primary-foreground">
                                {col.title}
                            </h4>
                            <ul className="flex flex-col gap-2.5">
                                {col.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-primary-foreground/60 transition-colors hover:text-primary-foreground"
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
            <div className="border-t border-primary-foreground/10">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <p className="text-xs text-primary-foreground/50">
                        &copy; {new Date().getFullYear()} Superteam Academy. All rights
                        reserved.
                    </p>
                    <div className="flex gap-4">
                        <Link
                            href="/privacy"
                            className="text-xs text-primary-foreground/50 hover:text-primary-foreground/80"
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            href="/terms"
                            className="text-xs text-primary-foreground/50 hover:text-primary-foreground/80"
                        >
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
