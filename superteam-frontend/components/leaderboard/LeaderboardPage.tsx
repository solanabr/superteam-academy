"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Zap, Award, Flame } from "lucide-react";

export type LeaderboardEntry = {
  rank: number;
  wallet: string;
  xp: number;
  level: number;
  streak: number;
};

export default function LeaderboardPage({
  entries = [],
  me = null,
}: {
  entries: LeaderboardEntry[];
  me: LeaderboardEntry | null;
}) {
  const myWallet = me?.wallet ?? null;
  const meInList = myWallet
    ? entries.some((e) => e.wallet === myWallet)
    : false;

  return (
    <div className="container mx-auto py-8 text-white">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Top developers by XP (on-chain)
        </p>
      </div>

      <Card className="bg-transparent">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b-gray-800">
                <TableHead className="text-white">Rank</TableHead>
                <TableHead className="text-white">Wallet</TableHead>
                <TableHead className="text-white">XP</TableHead>
                <TableHead className="text-white">Level</TableHead>
                <TableHead className="text-white">Streak</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow
                  key={entry.wallet}
                  className={
                    entry.wallet === myWallet
                      ? "bg-yellow-400/10 border-b-gray-800"
                      : "border-b-gray-800"
                  }
                >
                  <TableCell className="font-bold">#{entry.rank}</TableCell>
                  <TableCell>
                    {entry.wallet === myWallet ? (
                      <Link
                        href="/profile"
                        className="flex items-center gap-4 hover:underline"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>
                            {entry.wallet.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold">
                            {entry.wallet.slice(0, 4)}...
                            {entry.wallet.slice(-4)}
                          </p>
                          <p className="text-sm text-muted-foreground">You</p>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-4">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>
                            {entry.wallet.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-bold">
                          {entry.wallet.slice(0, 4)}...{entry.wallet.slice(-4)}
                        </p>
                      </div>
                    )}
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
              ))}
              {me && !meInList && (
                <TableRow className="bg-yellow-400/10 border-b-gray-800">
                  <TableCell className="font-bold">#{me.rank}</TableCell>
                  <TableCell>
                    <Link
                      href="/profile"
                      className="flex items-center gap-4 hover:underline"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {me.wallet.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold">
                          {me.wallet.slice(0, 4)}...{me.wallet.slice(-4)}
                        </p>
                        <p className="text-sm text-muted-foreground">You</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      {me.xp.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-blue-400" />
                      {me.level}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      {me.streak}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {entries.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No leaderboard data yet.
        </p>
      )}
    </div>
  );
}
