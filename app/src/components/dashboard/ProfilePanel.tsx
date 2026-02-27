
import { motion } from "framer-motion";
import { useGamification } from "@/context/GamificationContext";
import { cn } from "@/lib/utils";
import { Award, Lock } from "lucide-react";

export function ProfilePanel() {
  const { xp, level, achievements } = useGamification();
  
  const nextLevelXP = (level + 1) * 100;
  const currentLevelXP = level * 100;
  const progressPercent = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  
  // Level-based colors
  const levelColors: Record<number, string> = {
    1: "from-blue-500 to-cyan-400",
    2: "from-green-500 to-emerald-400",
    3: "from-purple-500 to-pink-400",
    4: "from-orange-500 to-yellow-400",
    5: "from-[#9945FF] to-[#14F195]", // Solana Gradient
  };

  const ringColor = levelColors[level] || "from-gray-500 to-gray-400";

  const allBadges = [
    { id: 'first_lesson', label: 'First Step', icon: <Award className="h-4 w-4" /> },
    { id: 'course_complete', label: 'Graduate', icon: <Award className="h-4 w-4" /> },
    { id: 'streak_7', label: 'Consistent', icon: <Award className="h-4 w-4" /> },
    { id: 'xp_1000', label: 'Grandmaster', icon: <Award className="h-4 w-4" /> },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="bg-[#0A0A0F]/80 backdrop-blur-xl border border-[#2E2E36] rounded-[2rem] p-8 text-center relative overflow-hidden group">
        {/* Background Glow */}
        <div className={cn("absolute -top-24 -left-24 w-48 h-48 blur-[80px] opacity-20 transition-all group-hover:opacity-30 rounded-full bg-gradient-to-br", ringColor)} />
        
        {/* Avatar Area */}
        <div className="relative inline-block mb-4">
          <div className={cn("w-32 h-32 rounded-full p-1 bg-gradient-to-tr shadow-2xl animate-spin-slow", ringColor)}>
            <div className="w-full h-full rounded-full bg-[#0A0A0F] flex items-center justify-center text-5xl">
              👨‍🚀
            </div>
          </div>
          <div className={cn("absolute bottom-1 right-1 px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10 shadow-lg bg-gradient-to-tr", ringColor)}>
            LVL {level}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Solanaut</h2>
        
        {/* XP Progress */}
        <div className="mt-6 space-y-2 text-left">
          <div className="flex justify-between text-xs font-medium">
             <span className="text-gray-400">{xp} XP</span>
             <span className="text-gray-500">{nextLevelXP} XP for Level {level + 1}</span>
          </div>
          <div className="relative h-3 w-full bg-[#1E1E24] rounded-full overflow-hidden border border-[#2E2E36]">
             <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="h-full bg-[#14F195] shadow-[0_0_15px_rgba(20,241,149,0.5)]"
             />
          </div>
        </div>

        {/* Badge Grid */}
        <div className="mt-10">
          <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-4 text-left">Badges</h3>
          <div className="grid grid-cols-4 gap-3">
             {allBadges.map((badge) => {
               const isOwned = achievements.includes(badge.id);
               return (
                 <div key={badge.id} className="group/badge relative">
                    <div className={cn(
                      "aspect-square rounded-xl flex items-center justify-center border transition-all duration-300",
                      isOwned 
                        ? "bg-[#14F195]/10 border-[#14F195]/30 text-[#14F195] glow-green" 
                        : "bg-[#1E1E24] border-[#2E2E36] text-gray-600"
                    )}>
                      {isOwned ? badge.icon : <Lock className="h-4 w-4" />}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black border border-[#2E2E36] rounded text-[10px] text-white opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      {badge.label}
                    </div>
                 </div>
               )
             })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
