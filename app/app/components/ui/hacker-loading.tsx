"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Terminal } from "lucide-react";

export function HackerLoading({ text = "INITIALIZING..." }: { text?: string }) {
    const GLITCH_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`0123456789ABCDEF";
    const [displayText, setDisplayText] = useState(text);

    useEffect(() => {
        let iteration = 0;
        const original = text;
        const interval = setInterval(() => {
            setDisplayText(
                original
                    .split("")
                    .map((char, index) => {
                        if (index < iteration) return original[index];
                        return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
                    })
                    .join("")
            );
            if (iteration >= original.length) clearInterval(interval);
            iteration += 1 / 3;
        }, 30);
        return () => clearInterval(interval);
    }, [text]);

    return (
        <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center font-mono relative overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-20">
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.05] to-transparent pointer-events-none" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-6">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="relative w-16 h-16"
                >
                    <div className="absolute inset-0 border-t-2 border-neon-cyan opacity-80 rounded-full blur-[1px]" />
                    <div className="absolute inset-2 border-r-2 border-neon-green opacity-40 rounded-full" />
                    <div className="absolute inset-4 border-b-2 border-white/20 rounded-full" />
                </motion.div>

                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-neon-cyan text-sm font-bold tracking-widest blur-[0.3px]">
                        <Terminal className="w-4 h-4 animate-pulse" />
                        {displayText}
                    </div>

                    <div className="w-48 h-1 bg-white/5 relative overflow-hidden mt-4">
                        <motion.div
                            className="absolute top-0 bottom-0 left-0 bg-neon-cyan"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
                        />
                    </div>

                    <div className="text-[10px] text-zinc-500 tracking-widest uppercase mt-2">
                        System Diagnostics
                    </div>
                </div>
            </div>
        </div>
    );
}
