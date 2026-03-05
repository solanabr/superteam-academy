"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBrand } from "@/components/providers/brand-provider";

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    const { brand, setBrand } = useBrand();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                <span className="h-4 w-4" />
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full transition-colors hover:bg-accent"
                >
                    <Palette className="h-4 w-4" />
                    <span className="sr-only">Toggle theme and brand</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mode</DropdownMenuLabel>
                <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className={`gap-2 cursor-pointer ${theme === "light" ? "bg-accent text-accent-foreground" : ""}`}
                >
                    <Sun className="h-4 w-4" />
                    Light
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className={`gap-2 cursor-pointer ${theme === "dark" ? "bg-accent text-accent-foreground" : ""}`}
                >
                    <Moon className="h-4 w-4" />
                    Dark
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className={`gap-2 cursor-pointer ${theme === "system" ? "bg-accent text-accent-foreground" : ""}`}
                >
                    <Monitor className="h-4 w-4" />
                    System
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Brand</DropdownMenuLabel>
                <DropdownMenuItem
                    onClick={() => setBrand("brazil")}
                    className={`gap-2 cursor-pointer ${brand === "brazil" ? "bg-accent text-accent-foreground" : ""}`}
                >
                    <div className="h-3 w-3 rounded-full bg-gradient-to-br from-[#ffd23f] to-[#008c4c]" />
                    Superteam Brazil
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setBrand("solana")}
                    className={`gap-2 cursor-pointer ${brand === "solana" ? "bg-accent text-accent-foreground" : ""}`}
                >
                    <div className="h-3 w-3 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195]" />
                    Solana Native
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
