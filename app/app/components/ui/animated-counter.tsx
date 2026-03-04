"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
    value: number;
    suffix?: string;
    prefix?: string;
    duration?: number;
    className?: string;
    decimals?: number;
}

export function AnimatedCounter({
    value,
    suffix = "",
    prefix = "",
    duration = 2,
    className,
    decimals = 0,
}: AnimatedCounterProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const [hasAnimated, setHasAnimated] = useState(false);

    const springValue = useSpring(0, {
        duration: duration * 1000,
        bounce: 0,
    });

    const displayValue = useTransform(springValue, (latest) => {
        if (decimals > 0) {
            return latest.toFixed(decimals);
        }
        return Math.round(latest).toLocaleString();
    });

    useEffect(() => {
        if (isInView && !hasAnimated) {
            springValue.set(value);
            setHasAnimated(true);
        }
    }, [isInView, hasAnimated, springValue, value]);

    return (
        <span ref={ref} className={className}>
            {prefix}
            <motion.span>{displayValue}</motion.span>
            {suffix}
        </span>
    );
}
