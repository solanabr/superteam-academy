// app/src/app/(dashboard)/leaderboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Loader2, Crown } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Leader {
  walletAddress: string;
  username: string | null;
  githubHandle: string | null;
  image: string | null;
  xp: number;
  streak: number;
}

interface CurrentUserData extends Leader {
    rank: number;
}

export default function LeaderboardPage() {
  const { publicKey } = useWallet();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("all");

  useEffect(() => {
    setLoading(true);
    const walletQuery = publicKey ? `&wallet=${publicKey.toString()}` : "";
    
    fetch(`/api/leaderboard?timeframe=${timeframe}${walletQuery}`)
      .then((res) => res.json())
      .then((data) => {
        setLeaders(data.leaderboard || []);
        setCurrentUser(data.currentUser || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [timeframe, publicKey]);

  const isUserInTop = currentUser && leaders.some(l => l.walletAddress === currentUser.walletAddress);

  // Выделяем ТОП-3 для Пьедестала
  const top3 = leaders.slice(0, 3);
  const restOfLeaders = leaders.slice(3);

  // Функция для отрисовки места на пьедестале
  const renderPodiumItem = (leader: Leader | undefined, position: 1 | 2 | 3) => {
    if (!leader) return <div className="w-[120px] md:w-[150px]" />; // Пустой блок для выравнивания

    const isMe = publicKey && leader.walletAddress === publicKey.toString();
    const displayName = leader.username || leader.githubHandle || `${leader.walletAddress.slice(0, 4)}...`;

    // Стили зависят от места
    const styles = {
        1: { height: "h-32 md:h-40", color: "from-yellow-400 to-yellow-600", border: "border-yellow-400", glow: "shadow-[0_0_40px_rgba(250,204,21,0.4)]", icon: <Crown className="h-6 w-6 text-yellow-400 mb-1" /> },
        2: { height: "h-24 md:h-32", color: "from-slate-300 to-slate-500", border: "border-slate-300", glow: "shadow-[0_0_30px_rgba(203,213,225,0.2)]", icon: <Crown className="h-5 w-5 text-slate-300 mb-1" /> },
        3: { height: "h-20 md:h-24", color: "from-amber-600 to-amber-800", border: "border-amber-600", glow: "shadow-[0_0_30px_rgba(217,119,6,0.2)]", icon: <Crown className="h-4 w-4 text-amber-600 mb-1" /> },
    }[position];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: position * 0.1, type: "spring", stiffness: 100 }}
            className={`flex flex-col items-center z-${4-position} relative`}
        >
            {styles.icon}
            <div className="relative mb-3">
                <Avatar className={cn("h-16 w-16 md:h-20 md:w-20 border-4", styles.border, styles.glow)}>
                    <AvatarImage src={leader.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${leader.walletAddress}`} alt={`${leader.username} avater-leaderboard`} />
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
                {isMe && <Badge className="absolute -bottom-2 -translate-x-1/2 left-1/2 text-[10px] px-1.5 h-4 bg-primary text-primary-foreground border-none shadow-sm">YOU</Badge>}
            </div>
            
            <span className="font-bold text-sm md:text-base truncate max-w-[100px] md:max-w-[140px] text-center mb-1">
                {displayName}
            </span>
            
            {/* Статистика на пьедестале (XP + Streak) */}
            <div className="flex flex-col items-center gap-1 mb-3">
                <span className="text-xs font-mono bg-background/80 backdrop-blur px-2 py-0.5 rounded-full border border-white/10 shadow-sm">
                    {leader.xp.toLocaleString()} XP
                </span>
                {leader.streak > 0 && (
                    <div className="flex items-center gap-1 text-orange-500 text-xs font-bold animate-pulse">
                        <Flame className="h-3 w-3 fill-orange-500" />
                        {leader.streak}
                    </div>
                )}
            </div>

            {/* Блок пьедестала */}
            <div className={cn("w-[100px] md:w-[140px] rounded-t-xl bg-gradient-to-b border-t border-x flex items-start justify-center pt-4 shadow-lg", styles.color, styles.height, "border-white/20 opacity-90")}>
                <span className="text-3xl md:text-5xl font-black text-white/30 drop-shadow-md">{position}</span>
            </div>
        </motion.div>
    );
  };

  return (
    <div className="flex-1 space-y-10 p-4 md:p-8 pt-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
            <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent pb-1">Hall of Fame</h2>
            <p className="text-lg text-muted-foreground">The most active builders in the Solana ecosystem.</p>
        </div>
        <Tabs value={timeframe} onValueChange={setTimeframe} className="w-full md:w-[400px]">
            <TabsList className="grid w-full grid-cols-3 h-12">
                <TabsTrigger value="week" className="text-sm">This Week</TabsTrigger>
                <TabsTrigger value="month" className="text-sm">This Month</TabsTrigger>
                <TabsTrigger value="all" className="text-sm">All Time</TabsTrigger>
            </TabsList>
        </Tabs>
      </div>

      {loading ? (
          <div className="flex h-64 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
      ) : leaders.length === 0 ? (
          <div className="flex h-64 items-center justify-center border-2 border-dashed rounded-xl border-muted-foreground/20">
              <p className="text-xl text-muted-foreground">No activity in this timeframe.</p>
          </div>
      ) : (
          <>
            {/* Podium Section (Top 3) */}
            <div className="flex items-end justify-center gap-2 md:gap-6 mt-12 mb-8 pt-8">
                {renderPodiumItem(top3[1], 2)}
                {renderPodiumItem(top3[0], 1)}
                {renderPodiumItem(top3[2], 3)}
            </div>

            {/* Table Section (4+) */}
            {restOfLeaders.length > 0 && (
                <Card className="bg-card/30 backdrop-blur-sm border-muted-foreground/10 overflow-hidden shadow-2xl">
                    <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                        <TableRow className="border-muted-foreground/10 hover:bg-transparent">
                            <TableHead className="w-[100px] text-center font-semibold">Rank</TableHead>
                            <TableHead className="font-semibold">Developer</TableHead>
                            <TableHead className="text-right hidden sm:table-cell font-semibold">Streak</TableHead>
                            <TableHead className="text-right font-semibold">XP Earned</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {restOfLeaders.map((leader, index) => {
                            const actualRank = index + 4; // Так как первые 3 на пьедестале
                            const isMe = publicKey && leader.walletAddress === publicKey.toString();
                            const displayName = leader.username || leader.githubHandle || `${leader.walletAddress.slice(0, 4)}...${leader.walletAddress.slice(-4)}`;
                            
                            return (
                            <TableRow key={leader.walletAddress} className={cn("border-muted-foreground/5 transition-colors", isMe ? "bg-primary/10 hover:bg-primary/20" : "hover:bg-muted/40")}>
                                <TableCell className="font-medium text-center text-muted-foreground">
                                    #{actualRank}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={leader.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${leader.walletAddress}`} alt={`${leader.username} avatar-tablecell`} />
                                            <AvatarFallback>D</AvatarFallback>
                                        </Avatar>
                                        <span className="font-semibold flex items-center gap-2">
                                            {displayName}
                                            {isMe && <Badge variant="default" className="text-[10px] h-5 px-1.5">YOU</Badge>}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right hidden sm:table-cell">
                                    {leader.streak > 0 ? (
                                        <div className="flex items-center justify-end gap-1.5 text-orange-500 font-medium">
                                            <Flame className="h-4 w-4 fill-orange-500" />
                                            {leader.streak}
                                        </div>
                                    ) : <span className="text-muted-foreground/30">-</span>}
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold text-primary text-base">
                                    {leader.xp.toLocaleString()}
                                </TableCell>
                            </TableRow>
                            );
                        })}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
            )}
          </>
      )}

      {/* Floating User Highlight Bar (Если юзер не в Топ-50) */}
      {!loading && currentUser && !isUserInTop && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-50"
          >
              <div className="flex items-center justify-between bg-background/80 backdrop-blur-xl border border-primary/30 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                          #{currentUser.rank}
                      </div>
                      <Avatar className="h-12 w-12 border-2 border-primary shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                          <AvatarImage src={currentUser.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.walletAddress}`} alt={`${currentUser.username} Avatar-current-user`} />
                      </Avatar>
                      <div className="flex flex-col">
                          <span className="font-bold text-lg leading-tight">You</span>
                      </div>
                  </div>
                  <div className="flex items-center gap-6">
                       <div className="hidden sm:flex items-center gap-1.5 text-orange-500 font-medium">
                            <Flame className="h-5 w-5 fill-orange-500" />
                            {currentUser.streak}
                        </div>
                      <div className="text-right">
                          <span className="font-mono font-black text-2xl text-primary">{currentUser.xp.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground ml-1 font-bold">XP</span>
                      </div>
                  </div>
              </div>
          </motion.div>
      )}
    </div>
  );
}