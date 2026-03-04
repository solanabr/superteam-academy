"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/src/i18n/routing";
import { useTranslations } from "next-intl";

import { Hexagon, Menu, X } from "lucide-react";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import { useState, useRef, useCallback } from "react";

/* ─── Nav Hacker Button (text scramble CTA) ─── */
const GLITCH_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`0123456789ABCDEF";

function NavHackerButton({ text }: { text: string }) {
    const [displayText, setDisplayText] = useState(text);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const scramble = useCallback(() => {
        let iteration = 0;
        const original = text;
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setDisplayText(
                original
                    .split("")
                    .map((char, idx) => {
                        if (idx < iteration) return original[idx];
                        return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
                    })
                    .join("")
            );
            if (iteration >= original.length) {
                if (intervalRef.current) clearInterval(intervalRef.current);
            }
            iteration += 1 / 2;
        }, 40);
    }, [text]);

    const reset = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayText(text);
    }, [text]);

    return (
        <Button
            variant="neon"
            className="btn-hacker font-mono font-semibold uppercase tracking-widest relative overflow-hidden"
            onMouseEnter={scramble}
            onMouseLeave={reset}
        >
            {displayText}
        </Button>
    );
}

export function Navigation() {
    const t = useTranslations("Navigation");
    const navLinks = [
        { href: "/courses", label: t("courses") },
        { href: "/leaderboard", label: t("leaderboard") },
        { href: "/certificates", label: t("credentials") },
        { href: "/community", label: t("community") },
        { href: "/dashboard", label: t("dashboard") },
    ];

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
                className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${isScrolled
                    ? "top-4 w-[92%] max-w-5xl bg-[#020408]/70 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_0_1px_rgba(0,255,163,0.05)]"
                    : "top-0 w-full bg-transparent"
                    }`}
            >
                <div className={`mx-auto px-4 md:px-6 flex items-center justify-between transition-all duration-500 ${isScrolled ? "h-14" : "h-16 md:h-20"}`}>
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-neon-green/30 blur-lg group-hover:bg-neon-green/50 transition-all duration-300" />
                            <Hexagon className="w-8 h-8 text-neon-green relative z-10 fill-neon-green/10 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="font-mono font-bold text-xl tracking-tighter">
                            Osmos
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-0">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="btn-slide-right relative px-4 py-2 text-sm font-mono font-medium text-zinc-400 hover:text-white transition-colors duration-300 overflow-hidden uppercase tracking-wider border border-transparent hover:border-white/[0.08]"
                            >
                                <span className="relative z-10">{link.label}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link href="/auth">
                            <NavHackerButton text={t("startBuilding")} />
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileOpen(!isMobileOpen)}
                        className="md:hidden relative z-50 p-2 text-zinc-400 hover:text-neon-green transition-colors"
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
                            className="absolute right-0 top-0 bottom-0 w-72 bg-[#0a0f1a] border-l border-white/10 p-6 pt-24 flex flex-col gap-1"
                        >
                            {navLinks.map((link, i) => (
                                <motion.div
                                    key={link.label}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 + 0.1 }}
                                >
                                    <Link
                                        href={link.href}
                                        onClick={() => setIsMobileOpen(false)}
                                        className="btn-slide-right relative block px-4 py-3 text-lg font-mono font-medium text-zinc-300 hover:text-white hover:bg-transparent border border-transparent hover:border-white/[0.08] transition-all overflow-hidden uppercase tracking-wider"
                                    >
                                        <span className="relative z-10">{link.label}</span>
                                    </Link>
                                </motion.div>
                            ))}
                            <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                                <Link href="/auth" onClick={() => setIsMobileOpen(false)} className="block w-full">
                                    <Button variant="neon" className="btn-hacker w-full font-mono font-semibold uppercase tracking-widest">
                                        {t("startBuilding")}
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
