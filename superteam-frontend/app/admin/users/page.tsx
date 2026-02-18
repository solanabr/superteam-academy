"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Users, Flame, Zap, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AdminUser = {
  wallet: string;
  level: number;
  xp: number;
  streak: number;
  streakLongest: number;
  lastActivityTs: number;
  rank: number | null;
  address: string;
};

function shortWallet(wallet: string) {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

function timeAgo(ts: number): string {
  if (ts === 0) return "Never";
  const sec = Math.floor(Date.now() / 1000 - ts);
  if (sec < 60) return "Just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d: AdminUser[]) => setUsers(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) =>
    u.wallet.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Badge variant="secondary" className="gap-1">
          <Users className="h-3 w-3" />
          {users.length} learners
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by wallet address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead className="text-right">Level</TableHead>
                  <TableHead className="text-right">XP</TableHead>
                  <TableHead className="text-right">Streak</TableHead>
                  <TableHead className="text-right">Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.wallet}>
                    <TableCell>
                      <Link
                        href={`/admin/users/${user.wallet}`}
                        className="font-mono text-sm hover:underline"
                      >
                        {shortWallet(user.wallet)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {user.rank ? (
                        <Badge variant="outline">#{user.rank}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">Lvl {user.level}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1">
                        <Zap className="h-3 w-3 text-primary" />
                        {user.xp.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-500" />
                        {user.streak}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {timeAgo(user.lastActivityTs)}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      {users.length === 0
                        ? "No learner profiles found on-chain."
                        : "No users match your search."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
