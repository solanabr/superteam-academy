"use client";

import {
  Anchor,
  Award,
  Bug,
  Calendar,
  Code,
  Crown,
  Flame,
  FootprintsIcon,
  GraduationCap,
  HandHelping,
  Layers,
  MessageSquare,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Footprints: FootprintsIcon,
  GraduationCap: GraduationCap,
  Zap: Zap,
  Flame: Flame,
  Calendar: Calendar,
  Crown: Crown,
  Code: Code,
  Anchor: Anchor,
  Layers: Layers,
  HandHelping: HandHelping,
  MessageSquare: MessageSquare,
  Star: Star,
  Sparkles: Sparkles,
  Bug: Bug,
  Trophy: Trophy,
};

interface AchievementIconProps {
  name: string;
  className?: string;
}

export function AchievementIcon({
  name,
  className = "h-5 w-5",
}: AchievementIconProps) {
  const IconComponent = ICON_MAP[name] || Award;
  return <IconComponent className={className} />;
}
