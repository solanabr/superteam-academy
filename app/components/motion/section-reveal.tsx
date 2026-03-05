"use client";

import { useRef } from "react";
import {
    motion,
    useInView,
    type Variants,
} from "framer-motion";

interface SectionRevealProps {
    children: React.ReactNode;
    className?: string;
    direction?: "up" | "down" | "left" | "right";
    delay?: number;
    duration?: number;
    once?: boolean;
}

const directionOffsets: Record<string, { x: number; y: number }> = {
    up: { x: 0, y: 40 },
    down: { x: 0, y: -40 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
};

export function SectionReveal({
    children,
    className,
    direction = "up",
    delay = 0,
    duration = 0.6,
    once = true,
}: SectionRevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once, margin: "-80px" });

    const offset = directionOffsets[direction];

    const variants: Variants = {
        hidden: {
            opacity: 0,
            x: offset.x,
            y: offset.y,
        },
        visible: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: {
                duration,
                delay,
                ease: [0.25, 0.4, 0.25, 1],
            },
        },
    };

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={variants}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/* Stagger container for child animations */
interface StaggerContainerProps {
    children: React.ReactNode;
    className?: string;
    staggerDelay?: number;
    delay?: number;
}

export function StaggerContainer({
    children,
    className,
    staggerDelay = 0.1,
    delay = 0,
}: StaggerContainerProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-80px" });

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: staggerDelay,
                        delayChildren: delay,
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
    },
};
