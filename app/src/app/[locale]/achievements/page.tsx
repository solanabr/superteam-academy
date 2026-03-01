'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Lock, Sparkles, Flame, BookOpen, Trophy, Star, Zap } from 'lucide-react';

interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  xpReward: number;
  earned: boolean;
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-enrollment',
    name: 'First Steps',
    description: 'Enroll in your first course',
    icon: BookOpen,
    xpReward: 50,
    earned: false,
  },
  {
    id: 'first-lesson',
    name: 'Quick Learner',
    description: 'Complete your first lesson',
    icon: Zap,
    xpReward: 100,
    earned: false,
  },
  {
    id: 'first-course',
    name: 'Course Master',
    description: 'Complete your first course',
    icon: Trophy,
    xpReward: 500,
    earned: false,
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    icon: Flame,
    xpReward: 200,
    earned: false,
  },
  {
    id: 'streak-30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day learning streak',
    icon: Flame,
    xpReward: 1000,
    earned: false,
  },
  {
    id: 'xp-1000',
    name: 'XP Hunter',
    description: 'Earn 1,000 XP',
    icon: Sparkles,
    xpReward: 100,
    earned: false,
  },
  {
    id: 'xp-10000',
    name: 'XP Legend',
    description: 'Earn 10,000 XP',
    icon: Star,
    xpReward: 500,
    earned: false,
  },
  {
    id: 'all-tracks',
    name: 'Renaissance Dev',
    description: 'Earn credentials in 3 different tracks',
    icon: Award,
    xpReward: 2000,
    earned: false,
  },
];

export default function AchievementsPage() {
  const t = useTranslations('achievements');

  return (
    <div className="container py-8 md:py-12">
      <div className="space-y-2 mb-8">
        <div className="flex items-center gap-3">
          <Award className="h-8 w-8 text-solana-purple" />
          <h1 className="text-3xl font-bold">{t('title')}</h1>
        </div>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {ACHIEVEMENTS.map((achievement) => (
          <Card
            key={achievement.id}
            className={`transition-all ${
              achievement.earned
                ? 'border-solana-purple/40 hover:border-solana-purple/60'
                : 'opacity-60 hover:opacity-80'
            }`}
          >
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start justify-between">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    achievement.earned
                      ? 'bg-solana-purple/20'
                      : 'bg-muted'
                  }`}
                >
                  {achievement.earned ? (
                    <achievement.icon className="h-6 w-6 text-solana-purple" />
                  ) : (
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <Badge variant={achievement.earned ? 'solana' : 'secondary'}>
                  {achievement.earned ? t('earned') : t('locked')}
                </Badge>
              </div>

              <div>
                <h3 className="font-semibold">{achievement.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {achievement.description}
                </p>
              </div>

              <div className="flex items-center gap-1 text-sm">
                <Sparkles className="h-3.5 w-3.5 text-xp-gold" />
                <span className="text-xp-gold font-medium">
                  {t('xpReward', { xp: achievement.xpReward })}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
