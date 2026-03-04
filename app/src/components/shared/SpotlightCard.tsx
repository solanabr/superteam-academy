"use client";

import { useRef, useState, ReactNode } from "react";

interface SpotlightCardProps {
    children: ReactNode;
    className?: string;
    variant?: "primary" | "secondary" | "accent";
}

export function SpotlightCard({ children, className = "", variant = "primary" }: SpotlightCardProps) {
    const divRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current || isFocused) return;

        const div = divRef.current;
        const rect = div.getBoundingClientRect();

        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleFocus = () => {
        setIsFocused(true);
        setOpacity(1);
    };

    const handleBlur = () => {
        setIsFocused(false);
        setOpacity(0);
    };

    const handleMouseEnter = () => {
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    // Convert variant to CSS variable for the spotlight color
    const getSpotlightColor = () => {
        switch (variant) {
            case "secondary":
                return "9945FF"; // Solana purple
            case "accent":
                return "FFB800"; // amber
            case "primary":
            default:
                return "14F195"; // Solana green
        }
    };

    const spotlightColor = getSpotlightColor();

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl transition-colors duration-500 hover:border-white/20 ${className}`}
            style={
                {
                    "--mouse-x": `${position.x}px`,
                    "--mouse-y": `${position.y}px`,
                } as React.CSSProperties
            }
        >
            {/* Background radial gradient that tracks mouse */}
            <div
                className="pointer-events-none absolute -inset-px transition-opacity duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.1), transparent 40%)`,
                }}
            />
            {/* Colored subtle inner glow that tracks mouse */}
            <div
                className="pointer-events-none absolute -inset-px transition-opacity duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), #${spotlightColor}15, transparent 40%)`,
                    zIndex: -1,
                }}
            />
            <div className="relative z-10 h-full">{children}</div>
        </div>
    );
}
