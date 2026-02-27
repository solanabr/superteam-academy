"use client";

import { useEffect, useState } from 'react';
import { ProgressService, User } from '@/services/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from '@solana/wallet-adapter-react';
import { cn } from '@/lib/utils';
import { LeaderboardPodium } from '@/components/leaderboard/LeaderboardPodium';
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Star } from "lucide-react";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [filter, setFilter] = useState("all-time");
  const { publicKey } = useWallet();

  useEffect(() => {
    ProgressService.getLeaderboard()
      .then(setLeaderboard)
      .catch(console.error);
  }, []);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Header */}
        <div className="text-center mb-12">
           <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#9945FF]/10 border border-[#9945FF]/20 text-[#9945FF] text-sm font-bold mb-6"
           >
              <Trophy className="h-4 w-4" /> Global Rankings
           </motion.div>
           <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
             Hall of <span className="text-gradient-solana">Solanauts</span>
           </h1>
           
           <Tabs defaultValue="all-time" className="w-full max-w-md mx-auto" onValueChange={setFilter}>
             <TabsList className="grid w-full grid-cols-3 bg-[#1E1E24]/50 border border-[#2E2E36] rounded-full p-1">
               <TabsTrigger value="weekly" className="rounded-full data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">Weekly</TabsTrigger>
               <TabsTrigger value="monthly" className="rounded-full data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">Monthly</TabsTrigger>
               <TabsTrigger value="all-time" className="rounded-full data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">All-time</TabsTrigger>
             </TabsList>
           </Tabs>
        </div>

        {/* Podium Section */}
        {leaderboard.length > 0 && (
          <LeaderboardPodium top3={top3} currentWallet={publicKey?.toString()} />
        )}

        {/* List Section */}
        <div className="mt-12">
          <Card className="bg-[#0A0A0F]/50 backdrop-blur-xl border border-[#2E2E36] rounded-[2rem] overflow-hidden shadow-2xl">
            <CardContent className="p-0">
              {leaderboard.length === 0 ? (
                  <div className="p-20 text-center">
                    <div className="animate-spin inline-block w-8 h-8 border-4 border-t-[#9945FF] border-r-transparent border-b-[#14F195] border-l-transparent rounded-full mb-4" />
                    <p className="text-gray-500 font-medium">Scanning the blockchain...</p>
                  </div>
              ) : ( rest.length > 0 ? (
                  <div className="divide-y divide-[#2E2E36]/50">
                      {rest.map((user, index) => {
                          const isMe = publicKey && user.walletAddress === publicKey.toString();
                          const rank = index + 4;

                          return (
                              <motion.div 
                                 key={user.walletAddress}
                                 initial={{ opacity: 0, x: -10 }}
                                 whileInView={{ opacity: 1, x: 0 }}
                                 viewport={{ once: true }}
                                 transition={{ delay: index * 0.05 }}
                                 className={cn(
                                    "grid grid-cols-12 gap-4 p-6 items-center transition-colors hover:bg-[#1E1E24]/50 relative",
                                    isMe && "bg-[#9945FF]/5 border-l-4 border-[#9945FF]"
                                 )}
                              >
                                  <div className="col-span-1 text-center font-black text-gray-600 text-lg">
                                      {rank}
                                  </div>
                                  <div className="col-span-1 flex justify-center">
                                      <div className="w-10 h-10 rounded-full bg-[#1E1E24] border border-[#2E2E36] flex items-center justify-center text-lg">
                                          👨‍🚀
                                      </div>
                                  </div>
                                  <div className="col-span-6 flex items-center gap-3">
                                      <div className="truncate">
                                          <div className={cn("font-bold text-base", isMe ? "text-[#14F195]" : "text-white")}>
                                              {user.username || user.walletAddress.slice(0, 8) + "..."}
                                          </div>
                                          {isMe && <div className="text-[10px] uppercase font-black text-[#9945FF]">That's you!</div>}
                                      </div>
                                      {rank <= 10 && <Star className="h-3 w-3 text-[#14F195] fill-[#14F195]" />}
                                  </div>
                                  <div className="col-span-2 text-right">
                                      <div className="font-mono text-[#14F195] font-bold">{user.xp.toLocaleString()}</div>
                                      <div className="text-[10px] text-gray-500 uppercase tracking-tighter">XP Earned</div>
                                  </div>
                                  <div className="col-span-2 text-right">
                                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1E1E24] border border-[#2E2E36] text-[10px] font-bold text-gray-400">
                                         LVL {user.level}
                                      </div>
                                  </div>
                              </motion.div>
                          );
                      })}
                  </div>
              ) : (
                <div className="p-8 text-center text-gray-500 italic">
                   Join the race to see yourself here!
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
