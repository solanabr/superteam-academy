"use client";

import { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { getMockLeaderboard } from "@/lib/services/mock-leaderboard";
import type { LeaderboardTimeframe } from "@/lib/services/learning-progress";
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

function Avatar({ wallet }: { wallet: string }) {
    const seed = wallet.slice(0, 8);
    const hue = parseInt(seed, 36) % 360;
    return (
        <div
            className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-xs font-medium text-white"
            style={{
                background: `linear-gradient(135deg, hsl(${hue}, 60%, 45%), hsl(${(hue + 40) % 360}, 50%, 35%)`,
            }}
        >
            {wallet.slice(0, 2).toUpperCase()}
        </div>
    );
}

export default function LeaderboardPage() {
    const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>("all-time");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const entries = getMockLeaderboard(timeframe);

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
        <div className="flex h-[calc(100vh-6rem)] flex-col justify-center overflow-hidden sm:h-[calc(100vh-7rem)]">
            <header className="shrink-0 bg-foreground text-background px-6 py-6 sm:px-8 sm:py-8 rounded-lg">
                <h1 className="text-xl font-bold sm:text-2xl">
                    Talent Leaderboard
                </h1>
                <p className="mt-0.5 text-sm text-background/80">
                    See where you stand amongst Solana&apos;s top contributors
                </p>
            </header>

            <div className="shrink-0 flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-3">
                <div className="flex gap-1 overflow-x-auto">
                    {timeframes.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => {
                                setTimeframe(value);
                                setPage(1);
                            }}
                            className={cn(
                                "shrink-0 rounded-none px-3 py-2 text-sm font-medium transition-colors",
                                timeframe === value
                                    ? "border-primary border-b-2 text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-44">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="h-9 pl-8"
                    />
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
                <div className="overflow-auto rounded-lg border border-border">
                    {filtered.length === 0 ? (
                        <div className="flex h-full items-center justify-center p-8">
                            <p className="text-sm text-muted-foreground">
                                No results
                            </p>
                        </div>
                    ) : (
                        <div className="h-fit w-full">
                            <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-border">
                                    <TableHead className="sticky top-0 z-10 w-20 bg-background px-4 py-3 font-medium">
                                        Rank
                                    </TableHead>
                                    <TableHead className="sticky top-0 z-10 bg-background px-4 py-3 font-medium">
                                        Name
                                    </TableHead>
                                    <TableHead className="sticky top-0 z-10 bg-background px-4 py-3 text-right font-medium">
                                        XP
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pageEntries.map((entry) => (
                                    <TableRow
                                        key={entry.wallet}
                                        className="border-b border-border/80 last:border-b-0"
                                    >
                                        <TableCell className="px-4 py-2.5 font-medium text-muted-foreground">
                                            #{entry.rank}
                                        </TableCell>
                                        <TableCell className="px-4 py-2.5">
                                            <div className="flex items-center gap-3">
                                                <Avatar wallet={entry.wallet} />
                                                <span className="font-medium text-foreground">
                                                    {truncateWallet(entry.wallet)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-4 py-2.5 text-right font-semibold tabular-nums">
                                            {entry.xp.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    )}
                </div>

                {filtered.length > 0 && (
                    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 bg-background py-2.5">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                                {start + 1}–{Math.min(start + pageSize, filtered.length)} of{" "}
                                {filtered.length}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="whitespace-nowrap">Rows per page</span>
                                <Select
                                    value={String(pageSize)}
                                    onValueChange={(v) => {
                                        setPageSize(Number(v));
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-16">
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
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handlePrev}
                                disabled={safePage <= 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">Previous</span>
                            </Button>
                            <span className="min-w-[4rem] px-2 text-center text-sm font-medium">
                                {safePage} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handleNext}
                                disabled={safePage >= totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                                <span className="sr-only">Next</span>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
