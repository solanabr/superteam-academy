"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Github, MessageCircle, Send } from "lucide-react";

export function Footer() {
    const t = useTranslations("footer");

    return (
        <footer className="border-t border-border bg-card/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-emerald-500 flex items-center justify-center font-bold text-white text-sm">
                                SA
                            </div>
                            <span className="font-bold text-lg">
                                <span className="gradient-text">Superteam</span> Academy
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-4">
                            {t("description")}
                        </p>
                        <div className="flex items-center gap-3">
                            <a
                                href="https://github.com/solanabr/superteam-academy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                            >
                                <Github className="w-5 h-5" />
                            </a>
                            <a
                                href="https://discord.gg/superteambrasil"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                            >
                                <MessageCircle className="w-5 h-5" />
                            </a>
                            <a
                                href="https://twitter.com/SuperteamBR"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-muted-foreground">
                            Platform
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Courses
                                </Link>
                            </li>
                            <li>
                                <Link href="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Leaderboard
                                </Link>
                            </li>
                            <li>
                                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Dashboard
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-muted-foreground">
                            Resources
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="https://solana.com/docs" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Solana Docs
                                </a>
                            </li>
                            <li>
                                <a href="https://www.anchor-lang.com/" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Anchor Docs
                                </a>
                            </li>
                            <li>
                                <a href="https://github.com/solanabr/superteam-academy" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    {t("github")}
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-muted-foreground">
                            {t("newsletter")}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            Stay updated with new courses and features.
                        </p>
                        <form
                            onSubmit={(e) => e.preventDefault()}
                            className="flex gap-2"
                        >
                            <input
                                type="email"
                                placeholder={t("subscribePlaceholder")}
                                className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <button
                                type="submit"
                                className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} Superteam Academy. {t("rights")}.
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {t("builtWith")} ❤️ {t("onSolana")}
                        <span className="inline-block w-3 h-3 ml-1">
                            <svg viewBox="0 0 398 312" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" fill="url(#a)" />
                                <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="url(#b)" />
                                <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="url(#c)" />
                                <defs>
                                    <linearGradient id="a" x1="84" y1="320" x2="360" y2="80" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#9945FF" />
                                        <stop offset="1" stopColor="#14F195" />
                                    </linearGradient>
                                    <linearGradient id="b" x1="84" y1="320" x2="360" y2="80" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#9945FF" />
                                        <stop offset="1" stopColor="#14F195" />
                                    </linearGradient>
                                    <linearGradient id="c" x1="84" y1="320" x2="360" y2="80" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#9945FF" />
                                        <stop offset="1" stopColor="#14F195" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </span>
                    </p>
                </div>
            </div>
        </footer>
    );
}
