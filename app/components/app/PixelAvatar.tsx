"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZES = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-20 w-20",
} as const;

/**
 * Get the avatar shuffle version for a wallet from localStorage.
 * Returns "" if no shuffle has been applied.
 */
export function getAvatarVersion(wallet: string): string {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(`avatar-v:${wallet}`) ?? "";
}

/**
 * Set a new avatar shuffle version for a wallet.
 */
export function setAvatarVersion(wallet: string, version: string) {
    localStorage.setItem(`avatar-v:${wallet}`, version);
}

/**
 * Generate DiceBear pixel-art avatar URL from a wallet address.
 */
export function getAvatarUrl(wallet: string, version?: string): string {
    const seed = version ? `${wallet}_${version}` : wallet;
    return `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(seed)}`;
}

interface PixelAvatarProps {
    wallet: string;
    size?: keyof typeof SIZES;
    className?: string;
    /** Override version (for preview in settings). If omitted, reads from localStorage. */
    version?: string;
}

export function PixelAvatar({ wallet, size = "md", className, version }: PixelAvatarProps) {
    const v = version ?? (typeof window !== "undefined" ? getAvatarVersion(wallet) : "");
    const url = getAvatarUrl(wallet, v || undefined);

    return (
        <Image
            src={url}
            alt="Avatar"
            width={80}
            height={80}
            className={cn(SIZES[size], "rounded-full shrink-0 bg-zinc-800", className)}
            unoptimized
        />
    );
}
