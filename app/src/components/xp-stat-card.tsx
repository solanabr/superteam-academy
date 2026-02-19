// app/src/components/xp-stat-card.tsx
"use client";

import { useEffect, useState } from "react";
import { useProgram } from "@/hooks/useProgram";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, Zap } from "lucide-react";
import { motion } from "framer-motion"; // Анимация чисел

// Хук для анимации числа (Count Up)
function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // Easing function (easeOutExpo)
      const ease = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      
      setCount(Math.floor(end * ease));

      if (progress < duration) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}

export function XpStatCard() {
  const { getXPBalance } = useProgram();
  const [xp, setXp] = useState(0);

  useEffect(() => {
    getXPBalance().then(setXp);
  }, [getXPBalance]);

  // Формула уровня: Level = floor(sqrt(XP / 100))
  const level = Math.floor(Math.sqrt(xp / 100));
  
  // Расчет прогресса до следующего уровня
  const nextLevelXp = Math.pow(level + 1, 2) * 100;
  const currentLevelBaseXp = Math.pow(level, 2) * 100;
  const xpInLevel = xp - currentLevelBaseXp;
  const xpNeeded = nextLevelXp - currentLevelBaseXp;
  const progress = Math.min((xpInLevel / xpNeeded) * 100, 100);

  const animatedXp = useCountUp(xp);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total XP</CardTitle>
          <Zap className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{animatedXp}</div>
          <p className="text-xs text-muted-foreground">Soulbound Tokens</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Level</CardTitle>
          <Trophy className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Lvl {level}</div>
          <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
            <motion.div 
                className="h-full bg-purple-500" 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1 }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}% to next level</p>
        </CardContent>
      </Card>

       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Achievements</CardTitle>
          <Star className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">NFT Badges earned</p>
        </CardContent>
      </Card>
    </div>
  );
}