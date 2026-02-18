"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OrbitRingProps {
    size?: number;
    className?: string;
    color?: string;
    duration?: number;
    dotCount?: number;
    strokeWidth?: number;
    reverse?: boolean;
    delay?: number;
}

export function OrbitRing({
    size = 400,
    className,
    color = "#00ffa3",
    duration = 20,
    dotCount = 3,
    strokeWidth = 1,
    reverse = false,
    delay = 0,
}: OrbitRingProps) {
    const radius = size / 2 - 10;

    return (
        <div
            className={cn("absolute pointer-events-none", className)}
            style={{ width: size, height: size }}
        >
            <motion.svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                initial={{ rotate: 0, opacity: 0 }}
                animate={{ rotate: reverse ? -360 : 360, opacity: 0.6 }}
                transition={{
                    rotate: {
                        duration,
                        repeat: Infinity,
                        ease: "linear",
                        delay,
                    },
                    opacity: { duration: 1, delay },
                }}
            >
                {/* Ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    opacity={0.2}
                    strokeDasharray="4 8"
                />

                {/* Orbiting dots */}
                {Array.from({ length: dotCount }).map((_, i) => {
                    const angle = (i * 360) / dotCount;
                    const rad = (angle * Math.PI) / 180;
                    const cx = size / 2 + radius * Math.cos(rad);
                    const cy = size / 2 + radius * Math.sin(rad);
                    return (
                        <circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r={3}
                            fill={color}
                            opacity={0.8}
                        >
                            <animate
                                attributeName="opacity"
                                values="0.3;1;0.3"
                                dur={`${2 + i * 0.5}s`}
                                repeatCount="indefinite"
                            />
                        </circle>
                    );
                })}
            </motion.svg>
        </div>
    );
}
