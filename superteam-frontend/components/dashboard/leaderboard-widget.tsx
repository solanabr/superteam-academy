"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export type LeaderboardWidgetEntry = {
  rank: number;
  wallet: string;
  xp: number;
};

export function LeaderboardWidget({
  entries = [],
}: {
  entries?: LeaderboardWidgetEntry[];
}) {
  const top = entries.slice(0, 5);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Leaderboard</CardTitle>
        <Link href="/leaderboard">
          <Button variant="ghost" size="sm">
            View All <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {top.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No leaderboard data yet.
            </p>
          ) : (
            top.map((user) => (
              <div key={user.wallet} className="flex items-center">
                <div className="font-bold w-8 text-center">{user.rank}</div>
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {user.wallet.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="font-semibold truncate">
                    {user.wallet.slice(0, 4)}...{user.wallet.slice(-4)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user.xp.toLocaleString()} XP
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
