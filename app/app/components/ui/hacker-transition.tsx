"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HackerLoading } from "./hacker-loading";
import { AnimatePresence, motion } from "framer-motion";

export function HackerTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        setIsLoading(true);
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800); // 800ms of "hacker" loading

        return () => clearTimeout(timer);
    }, [pathname, mounted]);

    return (
        <>
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        key="hacker-loader"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[100] bg-[#050810]"
                    >
                        <HackerLoading text="AUTHENTICATING_ROUTE..." />
                    </motion.div>
                )}
            </AnimatePresence>
            {children}
        </>
    );
}
