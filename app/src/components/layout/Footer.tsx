import Link from "next/link";
import { Github, Twitter } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t border-[hsl(var(--border))] mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    {/* Brand */}
                    <div>
                        <p className="font-heading font-bold text-lg mb-2">
                            Superteam <span className="gradient-text">Academy</span>
                        </p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                            Decentralized learning on Solana. Verifiable credentials, real XP, onchain proof.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <p className="font-semibold text-sm mb-3">Platform</p>
                        <ul className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
                            <li><Link href="/courses" className="hover:text-[hsl(var(--foreground))] transition-colors">Courses</Link></li>
                            <li><Link href="/leaderboard" className="hover:text-[hsl(var(--foreground))] transition-colors">Leaderboard</Link></li>
                            <li><Link href="/dashboard" className="hover:text-[hsl(var(--foreground))] transition-colors">Dashboard</Link></li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div>
                        <p className="font-semibold text-sm mb-3">Community</p>
                        <div className="flex gap-3">
                            <a
                                href="https://twitter.com/superteambr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center hover:bg-[hsl(var(--accent))] transition-colors"
                            >
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a
                                href="https://github.com/solanabr/superteam-academy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center hover:bg-[hsl(var(--accent))] transition-colors"
                            >
                                <Github className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-[hsl(var(--border))] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                    <p>© {new Date().getFullYear()} Superteam Brazil. MIT License.</p>
                    <p>
                        Program:{" "}
                        <a
                            href="https://explorer.solana.com/address/ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf?cluster=devnet"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 font-mono"
                        >
                            ACADBR...3ucf
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
