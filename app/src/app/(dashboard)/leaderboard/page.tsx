"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Flame } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";

interface Leader {
  walletAddress: string;
  username: string | null;
  xp: number;
  streak: number;
}

export default function LeaderboardPage() {
  const { publicKey } = useWallet();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        setLeaders(data);
        setLoading(false);
      });
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />;
    if (index === 2) return <Medal className="h-6 w-6 text-amber-600" />;
    return <span className="font-bold text-muted-foreground w-6 text-center">{index + 1}</span>;
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Leaderboard</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Students</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Streak</TableHead>
                <TableHead className="text-right">XP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow><TableCell colSpan={4} className="text-center h-24">Loading rankings...</TableCell></TableRow>
              ) : leaders.map((leader, index) => {
                const isMe = publicKey && leader.walletAddress === publicKey.toString();
                
                return (
                  <TableRow key={leader.walletAddress} className={isMe ? "bg-muted/50" : ""}>
                    <TableCell className="font-medium">
                        <div className="flex items-center justify-center">
                            {getRankIcon(index)}
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=${leader.walletAddress}`} />
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-semibold">
                                    {leader.username || `${leader.walletAddress.slice(0, 4)}...${leader.walletAddress.slice(-4)}`}
                                    {isMe && <Badge variant="secondary" className="ml-2 text-xs">You</Badge>}
                                </span>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 text-orange-500">
                            {leader.streak > 0 && <Flame className="h-4 w-4 fill-orange-500" />}
                            {leader.streak}
                        </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">{leader.xp.toLocaleString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}