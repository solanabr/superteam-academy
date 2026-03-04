"use client";

import Image from "next/image";
import Link from "next/link";

const LINK_COLUMNS = [
    {
        title: "Learn",
        links: [
            { label: "Intro to Solana", href: "/courses/intro-to-solana" },
            { label: "All Courses", href: "/courses" },
            { label: "Challenges", href: "/challenges" },
        ],
    },
    {
        title: "Community",
        links: [
            { label: "Leaderboard", href: "/leaderboard" },
            { label: "Discussions", href: "/discussions" },
            { label: "Discord", href: "https://discord.gg/superteam", external: true },
        ],
    },
    {
        title: "Resources",
        links: [
            { label: "Certificates", href: "/certificates" },
            { label: "GitHub", href: "https://github.com/satyawaniaman/superteam-academy", external: true },
            { label: "Solana Docs", href: "https://solana.com/docs", external: true },
        ],
    },
];

const SOCIAL_LINKS = [
    {
        label: "Twitter",
        href: "https://twitter.com/SuperteamBR",
        icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
    },
    {
        label: "Discord",
        href: "https://discord.gg/superteambr",
        icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.608 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1634-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
            </svg>
        ),
    },
    {
        label: "GitHub",
        href: "https://github.com/solanabr",
        icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
        ),
    },
];

export function Footer() {
    return (
        <footer className="relative w-full overflow-hidden border-t border-white/10 bg-background">
            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 pt-16 sm:pt-20 pb-24 sm:pb-28">
                <div className="grid gap-8 sm:gap-10 grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
                    {/* Brand column */}
                    <div className="max-w-xs">
                        <div className="flex items-center gap-2 mb-4">
                            <Image
                                src="/HORIZONTAL-LOGO/ST-DARK-GREEN-HORIZONTAL.png"
                                alt="Superteam Academy"
                                width={160}
                                height={36}
                                className="h-9 w-auto object-contain dark:hidden"
                            />
                            <Image
                                src="/HORIZONTAL-LOGO/ST-OFF-WHITE-HORIZONTAL.png"
                                alt="Superteam Academy"
                                width={160}
                                height={36}
                                className="h-9 w-auto object-contain hidden dark:block"
                            />
                        </div>
                        <p className="font-game text-base text-muted-foreground leading-relaxed">
                            The academy for Solana developers. Master on-chain programming
                            with hands-on courses and real-world projects.
                        </p>

                        {/* Social links */}
                        <div className="flex items-center gap-2.5 mt-5">
                            {SOCIAL_LINKS.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center size-9 rounded-lg border border-white/10 text-muted-foreground transition-all hover:bg-yellow-400/10 hover:text-yellow-400 hover:border-yellow-400/20"
                                    aria-label={social.label}
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    {LINK_COLUMNS.map((col) => (
                        <div key={col.title}>
                            <h4 className="mb-4 font-game text-lg text-yellow-400 uppercase tracking-wider">
                                {col.title}
                            </h4>
                            <ul className="flex flex-col gap-2.5">
                                {col.links.map((link) => (
                                    <li key={link.label}>
                                        {"external" in link && link.external ? (
                                            <a
                                                href={link.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-game text-base text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {link.label}
                                            </a>
                                        ) : (
                                            <Link
                                                href={link.href}
                                                className="font-game text-base text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {link.label}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom-centered watermark */}
            <div className="pointer-events-none absolute bottom-14 left-1/2 z-0 -translate-x-1/2 select-none">
                <h2 className="whitespace-nowrap font-game text-5xl uppercase leading-none tracking-tight text-foreground/10 sm:text-7xl md:text-8xl lg:text-9xl">
                    Superteam Academy
                </h2>
            </div>

            {/* Copyright bar */}
            <div className="relative z-20 border-t border-white/10 bg-background/85 backdrop-blur-sm">
                <div className="mx-auto flex max-w-7xl flex-col-reverse sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4">
                    <p className="font-game text-sm text-muted-foreground text-center sm:text-left">
                        &copy; {new Date().getFullYear()} Superteam Academy. Built on Solana.
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
