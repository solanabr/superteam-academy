"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface GradientBorderProps {
    children: React.ReactNode;
    className?: string;
    borderWidth?: number;
    gradient?: string;
    animated?: boolean;
}

export function GradientBorder({
    children,
    className,
    borderWidth = 1,
    gradient = "linear-gradient(135deg, #00ffa3, #00f0ff, #9945ff, #00ffa3)",
    animated = true,
}: GradientBorderProps) {
    return (
        <div
            className={cn("relative rounded-2xl group", className)}
            style={{ padding: borderWidth }}
        >
            {/* Gradient background (visible border) */}
            <div
                className={cn(
                    "absolute inset-0 rounded-2xl opacity-40 group-hover:opacity-100 transition-opacity duration-500",
                    animated && "animate-gradient-rotate"
                )}
                style={{
                    background: gradient,
                    backgroundSize: "300% 300%",
                }}
            />

            {/* Inner content */}
            <div className="relative bg-[#080c14] rounded-2xl z-10 h-full">
                {children}
            </div>
        </div>
    );
}
