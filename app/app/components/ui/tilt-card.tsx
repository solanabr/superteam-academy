"use client";
import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    glowColor?: string;
    tiltAmount?: number;
}

export function TiltCard({
    children,
    className,
    glowColor = "rgba(0, 255, 163, 0.15)",
    tiltAmount = 10,
}: TiltCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [tiltAmount, -tiltAmount]), {
        stiffness: 200,
        damping: 20,
    });
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-tiltAmount, tiltAmount]), {
        stiffness: 200,
        damping: 20,
    });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const xPos = (e.clientX - rect.left) / rect.width - 0.5;
        const yPos = (e.clientY - rect.top) / rect.height - 0.5;
        x.set(xPos);
        y.set(yPos);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
                perspective: "1000px",
            }}
            className={cn(
                "relative overflow-hidden transition-shadow duration-500 group",
                className
            )}
        >
            {/* Animated gradient border */}
            <div
                className="absolute -inset-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                    background: `conic-gradient(from var(--angle, 0deg), transparent, ${glowColor}, transparent, ${glowColor}, transparent)`,
                    animation: isHovered ? "spin-gradient 3s linear infinite" : "none",
                }}
            />

            {/* Spotlight glow following cursor */}
            <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"
                style={{
                    background: useTransform(
                        [x, y],
                        ([latestX, latestY]) =>
                            `radial-gradient(600px circle at ${((latestX as number) + 0.5) * 100}% ${((latestY as number) + 0.5) * 100}%, ${glowColor}, transparent 40%)`
                    ),
                }}
            />

            {/* Card content */}
            <div className="relative bg-[#0a0f1a]/90 backdrop-blur-sm p-px z-20">
                <div className="bg-[#0a0f1a]/90 relative z-10">
                    {children}
                </div>
            </div>
        </motion.div>
    );
}
