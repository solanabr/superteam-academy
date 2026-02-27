"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight, Trophy, Crown, Medal } from "lucide-react";
import { PixelAvatar } from "@/components/app";
import { getMockLeaderboard } from "@/lib/services/mock-leaderboard";
import type { LeaderboardEntry, LeaderboardTimeframe } from "@/lib/services/learning-progress";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const PAGE_SIZES = [10, 25, 50] as const;

const timeframes: { value: LeaderboardTimeframe; label: string }[] = [
    { value: "weekly", label: "Daily" },
    { value: "monthly", label: "Monthly" },
    { value: "all-time", label: "All Time" },
];

function truncateWallet(address: string) {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

async function fetchLeaderboard(timeframe: LeaderboardTimeframe): Promise<LeaderboardEntry[]> {
    const res = await fetch(`/api/leaderboard?timeframe=${timeframe}`);
    const data = (await res.json()) as { entries?: LeaderboardEntry[]; error?: string };
    if (!res.ok || data.error) return getMockLeaderboard(timeframe);
    return data.entries ?? [];
}

export default function LeaderboardPage() {
    const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>("all-time");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(10);

    const { data: entries = [] } = useQuery({
        queryKey: ["leaderboard", timeframe],
        queryFn: () => fetchLeaderboard(timeframe),
        placeholderData: (prev) => prev,
    });

    const filtered = useMemo(
        () =>
            search.trim()
                ? entries.filter(
                    (e) =>
                        e.wallet.toLowerCase().includes(search.toLowerCase()) ||
                        truncateWallet(e.wallet).toLowerCase().includes(search.toLowerCase())
                )
                : entries,
        [entries, search]
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const pageEntries = filtered.slice(start, start + pageSize);

    const handlePrev = () => setPage((p) => Math.max(1, p - 1));
    const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
            <div className="text-center mb-8 sm:mb-10">
                <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-4 sm:px-5 py-2 mb-3 sm:mb-4">
                    <Trophy className="h-4 w-4 text-yellow-400 shrink-0" />
                    <span className="font-game text-base sm:text-lg text-yellow-400">Global Rankings</span>
                </div>
                <h1 className="font-game text-4xl sm:text-5xl md:text-6xl px-2">
                    Talent <span className="text-yellow-400">Leaderboard</span>
                </h1>
                <p className="mt-2 sm:mt-3 font-game text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto px-2">
                    See where you stand amongst Solana&apos;s top contributors
                </p>
            </div>

            {entries.length >= 3 && (
                <div className="flex items-end justify-center gap-4 md:gap-8 mb-12 pt-10">
                    <div className="flex flex-col items-center">
                        <PixelAvatar wallet={entries[1].wallet} size="lg" />
                        <p className="font-game text-lg mt-2 truncate max-w-[120px] text-center">
                            {truncateWallet(entries[1].wallet)}
                        </p>
                        <p className="font-game text-xl text-muted-foreground">
                            {entries[1].xp.toLocaleString()} XP
                        </p>
                        <div className="w-28 md:w-36 h-20 bg-gradient-to-t from-muted to-muted/60 border-4 border-muted-foreground/30 rounded-t-xl flex items-center justify-center mt-2">
                            <div className="flex flex-col items-center">
                                <Medal className="h-5 w-5 text-muted-foreground" />
                                <span className="font-game text-2xl text-muted-foreground">#2</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center -mt-6">
                        <div className="relative">
                            <Crown className="h-8 w-8 text-yellow-400 absolute -top-8 left-1/2 -translate-x-1/2" />
                            <PixelAvatar wallet={entries[0].wallet} size="lg" />
                        </div>
                        <p className="font-game text-lg mt-2 truncate max-w-[120px] text-center">
                            {truncateWallet(entries[0].wallet)}
                        </p>
                        <p className="font-game text-xl text-yellow-400">
                            {entries[0].xp.toLocaleString()} XP
                        </p>
                        <div className="w-32 md:w-40 h-28 bg-gradient-to-t from-yellow-400/20 to-yellow-400/5 border-4 border-yellow-400 rounded-t-xl flex items-center justify-center mt-2 shadow-[0_0_30px_rgba(250,204,21,0.15)]">
                            <div className="flex flex-col items-center">
                                <Trophy className="h-6 w-6 text-yellow-400" />
                                <span className="font-game text-3xl text-yellow-400">#1</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center">
                        <PixelAvatar wallet={entries[2].wallet} size="lg" />
                        <p className="font-game text-lg mt-2 truncate max-w-[120px] text-center">
                            {truncateWallet(entries[2].wallet)}
                        </p>
                        <p className="font-game text-xl text-orange-400">
                            {entries[2].xp.toLocaleString()} XP
                        </p>
                        <div className="w-28 md:w-36 h-16 bg-gradient-to-t from-orange-400/20 to-orange-400/5 border-4 border-orange-400/50 rounded-t-xl flex items-center justify-center mt-2">
                            <div className="flex flex-col items-center">
                                <Medal className="h-5 w-5 text-orange-400" />
                                <span className="font-game text-2xl text-orange-400">#3</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div className="flex gap-2 overflow-x-auto">
                    {timeframes.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => {
                                setTimeframe(value);
                                setPage(1);
                            }}
                            className={cn(
                                "shrink-0 font-game text-xl px-5 py-2 rounded-xl border-2 transition-all",
                                timeframe === value
                                    ? "bg-yellow-400 text-black border-yellow-500 shadow-[2px_2px_0_0_#c69405]"
                                    : "bg-muted border-border hover:bg-accent"
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-52">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search wallets..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="h-10 pl-9 font-game text-lg bg-muted border-border"
                    />
                </div>
            </div>

            <div className="rounded-2xl border-4 overflow-x-auto overflow-y-hidden">
                {filtered.length === 0 ? (
                    <div className="flex items-center justify-center p-12">
                        <p className="font-game text-xl text-muted-foreground">No results found</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-b-2 border-border">
                                <TableHead className="w-16 sm:w-20 px-3 sm:px-5 py-3 sm:py-4 font-game text-base sm:text-xl text-muted-foreground">
                                    Rank
                                </TableHead>
                                <TableHead className="px-3 sm:px-5 py-3 sm:py-4 font-game text-base sm:text-xl text-muted-foreground">
                                    Player
                                </TableHead>
                                <TableHead className="px-3 sm:px-5 py-3 sm:py-4 text-right font-game text-base sm:text-xl text-muted-foreground">
                                    XP
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pageEntries.map((entry) => {
                                const isTop3 = entry.rank <= 3;
                                return (
                                    <TableRow
                                        key={entry.wallet}
                                        className={cn(
                                            "border-b border-border last:border-b-0 transition-colors hover:bg-muted/50",
                                            isTop3 && "bg-muted/30"
                                        )}
                                    >
                                        <TableCell className="px-3 sm:px-5 py-2 sm:py-3">
                                            <span className={cn(
                                                "font-game text-lg sm:text-xl",
                                                entry.rank === 1 ? "text-yellow-400" :
                                                    entry.rank === 2 ? "text-muted-foreground" :
                                                        entry.rank === 3 ? "text-orange-400" : "text-muted-foreground"
                                            )}>
                                                #{entry.rank}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-3 sm:px-5 py-2 sm:py-3">
                                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                                <PixelAvatar wallet={entry.wallet} size="sm" className="shrink-0" />
                                                <span className="font-game text-base sm:text-lg truncate">
                                                    {truncateWallet(entry.wallet)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-3 sm:px-5 py-2 sm:py-3 text-right font-game text-lg sm:text-xl tabular-nums text-yellow-400">
                                            {entry.xp.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </div>

            {filtered.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 mt-4 px-1">
                    <div className="flex items-center gap-4 font-game text-lg text-muted-foreground">
                        <span>
                            {start + 1}–{Math.min(start + pageSize, filtered.length)} of{" "}
                            {filtered.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap">Rows</span>
                            <Select
                                value={String(pageSize)}
                                onValueChange={(v) => {
                                    setPageSize(Number(v));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="h-9 w-16 font-game">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAGE_SIZES.map((n) => (
                                        <SelectItem key={n} value={String(n)}>
                                            {n}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={handlePrev}
                            disabled={safePage <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="min-w-[5rem] px-2 text-center font-game text-lg">
                            {safePage} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={handleNext}
                            disabled={safePage >= totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
