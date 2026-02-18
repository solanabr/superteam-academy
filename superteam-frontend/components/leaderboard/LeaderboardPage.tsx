"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Zap, Award, Flame, Loader2 } from "lucide-react";

export type LeaderboardEntry = {
  rank: number;
  wallet: string;
  xp: number;
  level: number;
  streak: number;
};

type TimeFilter = "all" | "monthly" | "weekly";

function EntryRow({
  entry,
  isMe,
  t,
}: {
  entry: LeaderboardEntry;
  isMe: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <TableRow
      className={
        isMe ? "bg-yellow-400/10 border-b-gray-800" : "border-b-gray-800"
      }
    >
      <TableCell className="font-bold">#{entry.rank}</TableCell>
      <TableCell>
        <Link
          href={isMe ? "/profile" : `/profile/${entry.wallet}`}
          className="flex items-center gap-4 hover:underline"
        >
          <Avatar className="w-10 h-10">
            <AvatarFallback>
              {entry.wallet.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold">
              {entry.wallet.slice(0, 4)}...{entry.wallet.slice(-4)}
            </p>
            {isMe && (
              <p className="text-sm text-muted-foreground">{t("you")}</p>
            )}
          </div>
        </Link>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          {entry.xp.toLocaleString()}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-blue-400" />
          {entry.level}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          {entry.streak}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function LeaderboardPage({
  entries: initialEntries = [],
  me = null,
}: {
  entries: LeaderboardEntry[];
  me: LeaderboardEntry | null;
}) {
  const t = useTranslations("leaderboard");
  const [filter, setFilter] = useState<TimeFilter>("all");
  const [entries, setEntries] = useState(initialEntries);
  const [loading, setLoading] = useState(false);
  const myWallet = me?.wallet ?? null;

  const fetchEntries = useCallback(async (f: TimeFilter) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?filter=${f}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
      }
    } catch {
      // keep current entries
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (filter !== "all") {
      fetchEntries(filter);
    } else {
      setEntries(initialEntries);
    }
  }, [filter, fetchEntries, initialEntries]);

  const meInList = myWallet
    ? entries.some((e) => e.wallet === myWallet)
    : false;

  return (
    <div className="container max-w-7xl mx-auto py-8 text-white">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-2 text-sm">{t("subtitle")}</p>
      </div>

      <div className="flex justify-center mb-6">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as TimeFilter)}>
          <TabsList>
            <TabsTrigger value="weekly">{t("weeklyFilter")}</TabsTrigger>
            <TabsTrigger value="monthly">{t("monthlyFilter")}</TabsTrigger>
            <TabsTrigger value="all">{t("allTimeFilter")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="bg-transparent">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b-gray-800">
                  <TableHead className="text-white">{t("rank")}</TableHead>
                  <TableHead className="text-white">{t("name")}</TableHead>
                  <TableHead className="text-white">{t("xp")}</TableHead>
                  <TableHead className="text-white">
                    {t("levelLabel")}
                  </TableHead>
                  <TableHead className="text-white">{t("streak")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <EntryRow
                    key={entry.wallet}
                    entry={entry}
                    isMe={entry.wallet === myWallet}
                    t={t}
                  />
                ))}
                {me && !meInList && <EntryRow entry={me} isMe t={t} />}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {!loading && entries.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          {t("noEntries")}
        </p>
      )}
    </div>
  );
}
