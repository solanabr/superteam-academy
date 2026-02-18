"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/ui/auth-button";
import { Hexagon, Menu, X } from "lucide-react";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";

const navLinks = [
    { href: "/auth", label: "Courses" },
    { href: "/auth", label: "Leaderboard" },
    { href: "/auth", label: "Credentials" },
    { href: "/auth", label: "Dashboard" },
];

export function Navigation() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 50);
    });

    return (
        <>
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled
                    ? "bg-[#020408]/80 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
                    : "bg-transparent"
                    }`}
            >
                <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-neon-green/30 blur-lg rounded-full group-hover:bg-neon-green/50 transition-all duration-300" />
                            <Hexagon className="w-8 h-8 text-neon-green relative z-10 fill-neon-green/10 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="font-bold text-xl tracking-tighter">
                            SUPERTEAM{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-neon-cyan">
                                ACADEMY
                            </span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="relative px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors group"
                            >
                                {link.label}
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-neon-green to-neon-cyan group-hover:w-full transition-all duration-300" />
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-3">
                        <div className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors">
                            <AuthButton />
                        </div>
                        <Link href="/auth">
                            <Button
                                variant="neon"
                                className="font-semibold relative overflow-hidden group"
                            >
                                <span className="relative z-10">Start Building</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-neon-green/20 to-neon-cyan/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileOpen(!isMobileOpen)}
                        className="md:hidden relative z-50 p-2 text-zinc-400 hover:text-white transition-colors"
                    >
                        {isMobileOpen ? (
                            <X className="w-6 h-6" />
                        ) : (
                            <Menu className="w-6 h-6" />
                        )}
                    </button>
                </div>
            </motion.header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-40 md:hidden"
                    >
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setIsMobileOpen(false)}
                        />
                        <motion.nav
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute right-0 top-0 bottom-0 w-72 bg-[#0a0f1a] border-l border-white/10 p-6 pt-24 flex flex-col gap-2"
                        >
                            {navLinks.map((link, i) => (
                                <motion.div
                                    key={link.href}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 + 0.1 }}
                                >
                                    <Link
                                        href={link.href}
                                        onClick={() => setIsMobileOpen(false)}
                                        className="block px-4 py-3 text-lg font-medium text-zinc-300 hover:text-neon-green rounded-lg hover:bg-white/5 transition-all"
                                    >
                                        {link.label}
                                    </Link>
                                </motion.div>
                            ))}
                            <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                                <div className="w-full">
                                    <AuthButton />
                                </div>
                                <Link href="/auth" onClick={() => setIsMobileOpen(false)} className="block w-full">
                                    <Button variant="neon" className="w-full font-semibold">
                                        Start Building
                                    </Button>
                                </Link>
                            </div>
                        </motion.nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
