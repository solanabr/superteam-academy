"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
    return (
        <section className="w-full min-h-[100dvh] flex items-center justify-center bg-background px-3 py-6 sm:px-4">
            {/* Background container */}
            <div className="relative w-full max-w-6xl h-full min-h-[85vh] sm:min-h-[90%] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-xl">
                {/* Background image */}
                <Image
                    src="/hero.gif"
                    alt="Hero Image"
                    fill
                    className="object-cover"
                    unoptimized
                    priority
                />

                {/* Dark overlay for contrast */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 sm:px-6">
                    <h2 className="font-game font-bold text-4xl sm:text-5xl md:text-7xl text-white">
                        Master
                    </h2>

                    <h2
                        className="font-game font-bold text-5xl sm:text-6xl md:text-8xl text-yellow-400 mt-2"
                        style={{
                            textShadow:
                                "1px 1px 0 oklch(0.21 0.006 285.885), -1px -1px 0 oklch(0.21 0.006 285.885), 0 2px 8px oklch(0 0 0 / 0.3)",
                        }}
                    >
                        Solana Development
                    </h2>

                    <p className="mt-4 sm:mt-6 max-w-3xl font-game text-lg sm:text-xl md:text-3xl text-white px-2">
                        Hands-on courses, soulbound credentials, and real-world projects
                    </p>

                    <Link href="/courses" className="mt-6 sm:mt-10">
                        <Button
                            variant="pixel"
                            className="px-6 py-4 sm:px-10 sm:py-6 text-xl sm:text-2xl md:text-3xl font-game"
                        >
                            Get Started
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}