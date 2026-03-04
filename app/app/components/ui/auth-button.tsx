"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";

export function AuthButton() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="h-10 w-32 bg-white/5 animate-pulse rounded-md" />
        );
    }

    return (
        <WalletMultiButton style={{
            backgroundColor: "transparent",
            color: "#a1a1aa", // zinc-400
            height: "40px",
            padding: "0 16px",
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            fontFamily: "var(--font-geist-sans)",
            border: "none",
            transition: "all 0.2s",
        }} />
    );
}
