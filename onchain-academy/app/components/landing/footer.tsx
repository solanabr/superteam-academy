"use client";

import { Hexagon, Github, ExternalLink } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const platformLinks = [
    { label: "Courses", href: "/auth" },
    { label: "Leaderboard", href: "/auth" },
    { label: "Credentials", href: "/auth" },
    { label: "Dashboard", href: "/auth" },
    { label: "Bounties", href: "/auth" },
];

const communityLinks = [
    { label: "Discord", href: "#", external: true },
    { label: "Twitter", href: "#", external: true },
    { label: "GitHub", href: "https://github.com/solanabr/superteam-academy", external: true },
    { label: "Superteam", href: "#", external: true },
];

const resourceLinks = [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Contributing", href: "#" },
    { label: "Brand Kit", href: "#" },
];

export function Footer() {
    return (
        <footer className="relative border-t border-white/[0.06] bg-[#020408] pt-16 pb-8 overflow-hidden">
            {/* Gradient line at top */}
            <div className="section-divider absolute top-0 left-0 right-0" />

            {/* Subtle background glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-neon-green/3 blur-[120px] rounded-full" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
                    {/* Brand */}
                    <div className="md:col-span-4 space-y-5">
                        <Link href="/" className="flex items-center gap-2.5 group w-fit">
                            <div className="relative">
                                <div className="absolute inset-0 bg-neon-green/20 blur-md rounded-full group-hover:bg-neon-green/40 transition-all" />
                                <Hexagon className="w-7 h-7 text-neon-green relative z-10 fill-neon-green/10" />
                            </div>
                            <span className="font-bold text-lg tracking-tighter">
                                SUPERTEAM{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-neon-cyan">
                                    ACADEMY
                                </span>
                            </span>
                        </Link>
                        <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
                            The ultimate open-source learning platform for Solana developers.
                            Build, ship, and earn on-chain credentials.
                        </p>
                        <div className="flex items-center gap-3">
                            <a
                                href="https://github.com/solanabr/superteam-academy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 hover:bg-white/10 transition-all"
                            >
                                <Github className="w-4 h-4" />
                            </a>
                            <a
                                href="#"
                                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 hover:bg-white/10 transition-all"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                            <a
                                href="#"
                                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 hover:bg-white/10 transition-all"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="md:col-span-2">
                        <h4 className="text-sm font-bold text-white mb-5 uppercase tracking-wider">Platform</h4>
                        <ul className="space-y-3">
                            {platformLinks.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-zinc-500 hover:text-neon-green transition-colors duration-200 flex items-center gap-1 group"
                                    >
                                        {link.label}
                                        <ArrowIcon />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="md:col-span-2">
                        <h4 className="text-sm font-bold text-white mb-5 uppercase tracking-wider">Community</h4>
                        <ul className="space-y-3">
                            {communityLinks.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        target={link.external ? "_blank" : undefined}
                                        rel={link.external ? "noopener noreferrer" : undefined}
                                        className="text-sm text-zinc-500 hover:text-neon-green transition-colors duration-200 flex items-center gap-1"
                                    >
                                        {link.label}
                                        {link.external && <ExternalLink className="w-3 h-3 opacity-50" />}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="md:col-span-2">
                        <h4 className="text-sm font-bold text-white mb-5 uppercase tracking-wider">Resources</h4>
                        <ul className="space-y-3">
                            {resourceLinks.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-zinc-500 hover:text-neon-green transition-colors duration-200 flex items-center gap-1 group"
                                    >
                                        {link.label}
                                        <ArrowIcon />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Built on Solana badge */}
                    <div className="md:col-span-2">
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195]" />
                                <span className="text-xs font-bold text-white">Built on Solana</span>
                            </div>
                            <p className="text-[11px] text-zinc-600 leading-relaxed">
                                Powered by Solana blockchain for XP tokens, credentials, and verifiable achievements.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-600">
                    <p>© 2024 Superteam Academy. Open Source under MIT License.</p>
                    <div className="flex gap-6">
                        <Link href="#" className="hover:text-zinc-400 transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="#" className="hover:text-zinc-400 transition-colors">
                            Terms of Service
                        </Link>
                        <Link href="#" className="hover:text-zinc-400 transition-colors">
                            Cookies
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function ArrowIcon() {
    return (
        <svg
            className="w-3 h-3 opacity-0 group-hover:opacity-50 -translate-x-1 group-hover:translate-x-0 transition-all"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
    );
}
