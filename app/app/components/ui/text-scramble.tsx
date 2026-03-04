"use client";
import React, { useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*";

interface TextScrambleProps {
    text: string;
    className?: string;
    delay?: number;
    speed?: number;
}

export function TextScramble({
    text,
    className,
    delay = 0,
    speed = 30,
}: TextScrambleProps) {
    const ref = React.useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });
    const [displayText, setDisplayText] = useState(text.replace(/[^ ]/g, " "));
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        if (!isInView || hasStarted) return;

        const timeout = setTimeout(() => {
            setHasStarted(true);
            let iteration = 0;
            const maxIterations = text.length;

            const interval = setInterval(() => {
                setDisplayText(
                    text
                        .split("")
                        .map((char, index) => {
                            if (char === " ") return " ";
                            if (index < iteration) return text[index];
                            return CHARS[Math.floor(Math.random() * CHARS.length)];
                        })
                        .join("")
                );

                iteration += 1 / 3;

                if (iteration >= maxIterations) {
                    setDisplayText(text);
                    clearInterval(interval);
                }
            }, speed);

            return () => clearInterval(interval);
        }, delay);

        return () => clearTimeout(timeout);
    }, [isInView, hasStarted, text, delay, speed]);

    return (
        <motion.span
            ref={ref}
            className={className}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3 }}
        >
            {displayText}
        </motion.span>
    );
}
