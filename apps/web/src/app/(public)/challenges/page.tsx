'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Zap, Clock, Trophy, Calendar, Star, CheckCircle2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { challengesService } from '@/services/challenges.service';
import type { Challenge, SeasonalEvent, ChallengeDifficulty } from '@/services/challenges.service';

const difficultyColors: Record<ChallengeDifficulty, string> = {
  easy: 'bg-green-500/10 text-green-500',
  medium: 'bg-yellow-500/10 text-yellow-500',
  hard: 'bg-red-500/10 text-red-500',
};

const statusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  'in-progress': <Play className="h-4 w-4 text-yellow-500" />,
  'not-started': <Star className="h-4 w-4 text-muted-foreground" />,
  expired: <Clock className="h-4 w-4 text-red-500" />,
};

function ChallengeCard({ challenge, onStart }: { challenge: Challenge; onStart: (id: string) => void }) {
  const t = useTranslations('challenges');
  const diffKey = challenge.difficulty as ChallengeDifficulty;

  return (
    <div className="rounded-xl border bg-card p-5 transition-colors hover:border-primary/50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {statusIcons[challenge.status]}
            <h3 className="font-semibold">{challenge.title}</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{challenge.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className={difficultyColors[diffKey]}>
              {t(diffKey)}
            </Badge>
            <Badge variant="outline">
              <Trophy className="mr-1 h-3 w-3" /> {challenge.xpReward} {t('xpReward')}
            </Badge>
            <Badge variant="outline">
              <Clock className="mr-1 h-3 w-3" /> {challenge.timeLimit} {t('minutes')}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {challenge.tags.map((tag) => (
              <span key={tag} className="rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="ml-4">
          {challenge.status === 'not-started' && (
            <Button size="sm" onClick={() => onStart(challenge.id)}>
              {t('notStarted')}
            </Button>
          )}
          {challenge.status === 'completed' && (
            <Badge variant="secondary" className="bg-green-500/10 text-green-500">
              {t('completed')}
            </Badge>
          )}
          {challenge.status === 'in-progress' && (
            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
              {t('inProgress')}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function SeasonalEventCard({ event }: { event: SeasonalEvent }) {
  const t = useTranslations('challenges');
  const progress = event.totalXP > 0 ? (event.completedXP / event.totalXP) * 100 : 0;

  return (
    <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{t(`events.${event.nameKey}`)}</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{t(`events.${event.descriptionKey}`)}</p>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>{event.completedXP} / {event.totalXP} XP</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        {event.startDate} — {event.endDate}
      </div>
    </div>
  );
}

export default function ChallengesPage() {
  const t = useTranslations('challenges');
  const [dailyChallenges, setDailyChallenges] = useState<Challenge[]>([]);
  const [weeklyChallenges, setWeeklyChallenges] = useState<Challenge[]>([]);
  const [events, setEvents] = useState<SeasonalEvent[]>([]);

  useEffect(() => {
    challengesService.getChallenges('daily').then(setDailyChallenges);
    challengesService.getChallenges('weekly').then(setWeeklyChallenges);
    challengesService.getSeasonalEvents().then(setEvents);
  }, []);

  const handleStart = async (id: string) => {
    await challengesService.startChallenge(id);
    // Refresh
    challengesService.getChallenges('daily').then(setDailyChallenges);
    challengesService.getChallenges('weekly').then(setWeeklyChallenges);
  };

  return (
    <div className="container py-8">
      <div className="flex items-center gap-3">
        <Zap className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      <Tabs defaultValue="daily" className="mt-8">
        <TabsList>
          <TabsTrigger value="daily">{t('daily')}</TabsTrigger>
          <TabsTrigger value="weekly">{t('weekly')}</TabsTrigger>
          <TabsTrigger value="seasonal">{t('seasonal')}</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-6 space-y-4">
          {dailyChallenges.map((ch) => (
            <ChallengeCard key={ch.id} challenge={ch} onStart={handleStart} />
          ))}
        </TabsContent>

        <TabsContent value="weekly" className="mt-6 space-y-4">
          {weeklyChallenges.map((ch) => (
            <ChallengeCard key={ch.id} challenge={ch} onStart={handleStart} />
          ))}
        </TabsContent>

        <TabsContent value="seasonal" className="mt-6 grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <SeasonalEventCard key={event.id} event={event} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
