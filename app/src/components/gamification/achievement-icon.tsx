"use client";

import {
  Award,
  BookOpen,
  Code,
  Flame,
  FootprintsIcon,
  GraduationCap,
  MessageSquare,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Target,
  Timer,
  Trophy,
  TrendingUp,
  Users,
  Zap,
  Bug,
  Moon,
  Coins,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Footprints: FootprintsIcon,
  GraduationCap: GraduationCap,
  Target: Target,
  Flame: Flame,
  BookHeart: BookOpen,
  BookOpen: BookOpen,
  Code: Code,
  MessageSquare: MessageSquare,
  Sparkles: Sparkles,
  Star: Star,
  Trophy: Trophy,
  Shield: Shield,
  Zap: Zap,
  Rocket: Rocket,
  TrendingUp: TrendingUp,
  Timer: Timer,
  Users: Users,
  Bug: Bug,
  Moon: Moon,
  Coins: Coins,
};

interface AchievementIconProps {
  name: string;
  className?: string;
}

export function AchievementIcon({ name, className = "h-5 w-5" }: AchievementIconProps) {
  const IconComponent = ICON_MAP[name] || Award;
  return <IconComponent className={className} />;
}
