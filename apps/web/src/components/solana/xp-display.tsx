import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Zap } from "lucide-react"

export function XPDisplay({ currentXP, nextLevelXP = 1000 }: { currentXP: number, nextLevelXP?: number }) {
  const currentLevel = Math.floor(currentXP / 1000) + 1
  const xpForNextLevel = currentLevel * 1000
  const progressPercentage = Math.min(100, Math.max(0, (currentXP / xpForNextLevel) * 100))

  return (
    <div className="flex flex-col gap-4 p-6 bg-card neo-brutal-border neo-brutal-shadow">
      <div className="flex items-center justify-between border-b-4 border-border pb-4">
        <div className="flex items-center gap-2 text-warning">
          <Zap className="h-8 w-8 fill-warning" strokeWidth={3} />
          <span className="text-4xl font-black font-mono tracking-tighter text-foreground">{currentXP.toLocaleString()}</span>
          <span className="text-xl font-bold uppercase text-muted-foreground mt-2">XP</span>
        </div>
        <Badge variant="accent" shape="pill" className="text-lg px-4 py-1 border-3">Level {currentLevel}</Badge>
      </div>
      
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs font-black uppercase text-muted-foreground">
          <span>Progress to Lvl {currentLevel + 1}</span>
          <span>{currentXP.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP</span>
        </div>
        <Progress value={progressPercentage} indicatorColor="bg-warning" className="h-6 bg-muted/50 border-3" />
      </div>
    </div>
  )
}
