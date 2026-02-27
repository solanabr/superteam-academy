
"use client";

import { motion } from "framer-motion";
import { Zap, BookOpen, Trophy, Clock } from "lucide-react";

interface Activity {
  id: string;
  type: 'xp' | 'start' | 'badge';
  title: string;
  subtitle: string;
  time: string;
  icon: React.ReactNode;
}

export function ActivityFeed() {
  const activities: Activity[] = [
    {
      id: "1",
      type: "xp",
      title: "Earned 500 XP",
      subtitle: "Completed: Welcome to Solana",
      time: "2 hours ago",
      icon: <Zap className="h-3 w-3 text-[#14F195]" />,
    },
    {
      id: "2",
      type: "start",
      title: "Started Course",
      subtitle: "Rust for Solana Developers",
      time: "5 hours ago",
      icon: <BookOpen className="h-3 w-3 text-[#9945FF]" />,
    },
    {
       id: "3",
       type: "badge",
       title: "Unlocked Badge",
       subtitle: "Consistent Learner (7 Day Streak)",
       time: "1 day ago",
       icon: <Trophy className="h-3 w-3 text-yellow-500" />,
    }
  ];

  return (
    <div className="bg-[#0A0A0F]/50 border border-[#2E2E36] rounded-[2rem] p-8 mt-8">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-white">Recent Activity</h3>
        <Clock className="h-4 w-4 text-gray-500" />
      </div>

      <div className="space-y-6">
        {activities.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-4 group"
          >
            <div className="mt-1 p-2 rounded-lg bg-[#1E1E24] border border-[#2E2E36] group-hover:border-[#9945FF]/30 transition-colors">
               {item.icon}
            </div>
            <div className="flex-1 border-b border-[#2E2E36]/30 pb-4 last:border-0 group-hover:border-[#9945FF]/20 transition-colors">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-bold text-white">{item.title}</h4>
                <span className="text-[10px] text-gray-600">{item.time}</span>
              </div>
              <p className="text-xs text-gray-500">{item.subtitle}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
