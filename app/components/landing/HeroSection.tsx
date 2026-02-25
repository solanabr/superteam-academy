"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
    return (
        <section className="w-full h-screen flex items-center justify-center bg-zinc-900">
            {/* Background container */}
            <div className="relative w-[95%] md:w-[90%] lg:w-[85%] h-[90%] rounded-3xl overflow-hidden border border-white/10 shadow-xl">
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
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
                    <h2 className="font-game font-bold text-5xl md:text-7xl">
                        Master
                    </h2>

                    <h2
                        className="font-game font-bold text-6xl md:text-8xl text-yellow-400 mt-2"
                        style={{
                            textShadow:
                                "2px 2px 0 #000, -2px -2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000",
                        }}
                    >
                        Solana Development
                    </h2>

                    <p className="mt-6 max-w-3xl font-game text-xl md:text-3xl text-white/90">
                        Hands-on courses, soulbound credentials, and real-world projects
                    </p>

                    <Link href="/courses">
                        <Button
                            variant="pixel"
                            className="mt-10 px-10 py-6 text-2xl md:text-3xl font-game"
                        >
                            Get Started
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}