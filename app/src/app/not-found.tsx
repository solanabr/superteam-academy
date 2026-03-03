"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, BookOpen, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <main className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
            {/* Glowing background */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                className="relative"
            >
                {/* 404 number */}
                <div className="relative">
                    <p className="bg-gradient-to-br from-primary via-secondary to-accent bg-clip-text text-[10rem] font-black leading-none tracking-tighter text-transparent select-none sm:text-[14rem]">
                        404
                    </p>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 blur-3xl" />
                </div>

                {/* Alert icon */}
                <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: [-4, 4, -4] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="mx-auto -mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(20,241,149,0.15)]"
                >
                    <AlertTriangle className="h-6 w-6 text-primary" />
                </motion.div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 space-y-3"
            >
                <h1 className="text-2xl font-bold sm:text-3xl">Page Not Found</h1>
                <p className="max-w-sm text-muted-foreground">
                    This address doesn&apos;t exist on-chain or off-chain. Let&apos;s get you back on track.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-10 flex flex-col gap-3 sm:flex-row"
            >
                <Button asChild size="lg" className="gap-2">
                    <Link href="/">
                        <Home className="h-4 w-4" />
                        Back to Home
                    </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                    <Link href="/courses">
                        <BookOpen className="h-4 w-4" />
                        Browse Courses
                    </Link>
                </Button>
            </motion.div>

            {/* Grid decoration */}
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-10" />
        </main>
    );
}
