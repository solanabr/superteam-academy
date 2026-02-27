
"use client";

import { motion } from "framer-motion";
import { User } from "@/services/progress";
import { cn } from "@/lib/utils";
import { Crown, Award, Trophy } from "lucide-react";

interface LeaderboardPodiumProps {
  top3: User[];
  currentWallet?: string;
}

export function LeaderboardPodium({ top3, currentWallet }: LeaderboardPodiumProps) {
  // Ensure we have 3 slots even if less users
  const slots = [
    { rank: 2, user: top3[1], color: "text-[#C0C0C0]", bg: "bg-gray-100", label: "Silver" },
    { rank: 1, user: top3[0], color: "text-[#FFD700]", bg: "bg-yellow-400", label: "Gold", hasCrown: true },
    { rank: 3, user: top3[2], color: "text-[#CD7F32]", bg: "bg-orange-600", label: "Bronze" },
  ];

  return (
    <div className="flex items-end justify-center w-full max-w-2xl mx-auto gap-2 md:gap-4 px-4 py-20 pb-10">
      {slots.map((slot, index) => {
        const isMe = currentWallet && slot.user?.walletAddress === currentWallet;
        const height = slot.rank === 1 ? 'h-[250px]' : slot.rank === 2 ? 'h-[200px]' : 'h-[160px]';
        
        return (
          <motion.div
            key={slot.rank}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.8 }}
            className={cn(
              "flex-1 flex flex-col items-center relative",
              slot.rank === 1 ? "z-10" : "z-0"
            )}
          >
            {/* User Info Above Bar */}
            <div className="mb-4 flex flex-col items-center">
              <div className="relative mb-2">
                 {slot.hasCrown && (
                   <motion.div 
                     animate={{ rotate: [0, 10, -10, 0] }}
                     transition={{ repeat: Infinity, duration: 4 }}
                     className="absolute -top-6 left-1/2 -translate-x-1/2"
                   >
                     <Crown className="h-8 w-8 text-yellow-500 fill-yellow-500/30" />
                   </motion.div>
                 )}
                 <div className={cn(
                   "w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-tr p-[2px] shadow-2xl transition-all",
                   slot.rank === 1 ? "from-yellow-400 via-[#9945FF] to-yellow-400 shadow-yellow-500/20 scale-110" : "from-[#2E2E36] to-transparent"
                 )}>
                   <div className="w-full h-full rounded-full bg-[#0A0A0F] flex items-center justify-center text-3xl">
                     {slot.rank === 1 ? "🥇" : slot.rank === 2 ? "🥈" : "🥉"}
                   </div>
                 </div>
              </div>
              <div className={cn("text-sm font-bold truncate max-w-[80px]", isMe ? "text-[#14F195]" : "text-white")}>
                {slot.user?.username || (slot.user?.walletAddress ? slot.user.walletAddress.slice(0, 5) : "---")}
              </div>
              <div className="text-[10px] text-gray-500 font-mono">
                {slot.user ? `${slot.user.xp.toLocaleString()} XP` : "-"}
              </div>
            </div>

            {/* The Bar */}
            <div className={cn(
              "w-full rounded-t-3xl relative overflow-hidden flex flex-col items-center justify-start py-8",
              height,
              slot.rank === 1 
                ? "bg-gradient-to-b from-[#9945FF] to-[#0A0A0F] border-x border-t border-[#9945FF]/50 shadow-[0_0_40px_rgba(153,69,255,0.2)]" 
                : "bg-gradient-to-b from-[#1E1E24] to-[#0A0A0F] border-x border-t border-[#2E2E36]"
            )}>
               <div className={cn("text-2xl font-black italic opacity-20", slot.color)}>
                  #{slot.rank}
               </div>
               
               {slot.rank === 1 && (
                  <div className="absolute top-1/2 -translate-y-1/2 opacity-10">
                    <Trophy className="h-24 w-24 text-white" />
                  </div>
               )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
