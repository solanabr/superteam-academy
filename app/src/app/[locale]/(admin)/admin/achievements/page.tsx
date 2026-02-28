'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { AUTHORITY } from '@/lib/solana/constants';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ShieldAlert,
  Wallet,
  Award,
  Flame,
  Target,
  Star,
  Zap,
  Trophy,
  BookOpen,
  Users,
  Send,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  recipients: number;
  active: boolean;
  iconColor: string;
  iconBg: string;
}

const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-blood',
    name: 'First Blood',
    description: 'Complete your first lesson',
    icon: Zap,
    recipients: 1842,
    active: true,
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-950',
  },
  {
    id: 'streak-master',
    name: 'Streak Master',
    description: 'Maintain a 30-day learning streak',
    icon: Flame,
    recipients: 247,
    active: true,
    iconColor: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-950',
  },
  {
    id: 'knowledge-seeker',
    name: 'Knowledge Seeker',
    description: 'Enroll in 5 different courses',
    icon: BookOpen,
    recipients: 634,
    active: true,
    iconColor: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-950',
  },
  {
    id: 'early-adopter',
    name: 'Early Adopter',
    description: 'Join during the platform beta phase',
    icon: Star,
    recipients: 892,
    active: false,
    iconColor: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-100 dark:bg-violet-950',
  },
  {
    id: 'top-performer',
    name: 'Top Performer',
    description: 'Rank in the top 10 on the leaderboard',
    icon: Trophy,
    recipients: 10,
    active: true,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950',
  },
  {
    id: 'completionist',
    name: 'Completionist',
    description: 'Complete all lessons in a course',
    icon: Target,
    recipients: 389,
    active: true,
    iconColor: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-100 dark:bg-rose-950',
  },
  {
    id: 'community-builder',
    name: 'Community Builder',
    description: 'Refer 10 users to the platform',
    icon: Users,
    recipients: 56,
    active: true,
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    iconBg: 'bg-cyan-100 dark:bg-cyan-950',
  },
  {
    id: 'certified-dev',
    name: 'Certified Developer',
    description: 'Earn 3 or more credentials',
    icon: Award,
    recipients: 178,
    active: true,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
  },
];

function UnauthorizedState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <ShieldAlert className="size-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Unauthorized</h1>
        <p className="text-muted-foreground max-w-md">
          Admin access is required to manage achievements.
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2">
        <Wallet className="size-4 text-muted-foreground" />
        <code className="text-xs font-mono text-muted-foreground">
          Required: {AUTHORITY.toBase58().slice(0, 8)}...
          {AUTHORITY.toBase58().slice(-8)}
        </code>
      </div>
    </div>
  );
}

function AwardDialog() {
  const [walletInput, setWalletInput] = useState('');
  const [selectedAchievement, setSelectedAchievement] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const activeAchievements = MOCK_ACHIEVEMENTS.filter((a) => a.active);

  const handleAward = () => {
    // Placeholder: would call the on-chain award achievement instruction
    setIsOpen(false);
    setWalletInput('');
    setSelectedAchievement('');
  };

  const isValid = walletInput.length >= 32 && selectedAchievement !== '';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Award className="size-4" />
          Award Achievement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Award Achievement</DialogTitle>
          <DialogDescription>
            Grant an achievement to a specific wallet address. This will trigger
            an on-chain transaction.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="wallet-address">Wallet Address</Label>
            <Input
              id="wallet-address"
              placeholder="Enter Solana wallet address..."
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="achievement-select">Achievement</Label>
            <Select
              value={selectedAchievement}
              onValueChange={setSelectedAchievement}
            >
              <SelectTrigger id="achievement-select" className="w-full">
                <SelectValue placeholder="Select an achievement..." />
              </SelectTrigger>
              <SelectContent>
                {activeAchievements.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleAward}
            disabled={!isValid}
            className="gap-2"
          >
            <Send className="size-4" />
            Award
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const Icon = achievement.icon;

  return (
    <Card
      className={cn(
        'gap-0 py-4 transition-opacity',
        !achievement.active && 'opacity-60',
      )}
    >
      <CardContent className="flex items-start gap-4">
        <div className={cn('rounded-lg p-2.5 shrink-0', achievement.iconBg)}>
          <Icon className={cn('size-5', achievement.iconColor)} />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{achievement.name}</h3>
            <Badge
              variant={achievement.active ? 'default' : 'secondary'}
              className="text-[10px]"
            >
              {achievement.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {achievement.description}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {achievement.recipients.toLocaleString()}
            </span>{' '}
            recipients
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminAchievementsPage() {
  const { publicKey, connected } = useWallet();

  const isAuthorized =
    connected && publicKey?.toBase58() === AUTHORITY.toBase58();

  if (!isAuthorized) {
    return <UnauthorizedState />;
  }

  const activeCount = MOCK_ACHIEVEMENTS.filter((a) => a.active).length;
  const totalRecipients = MOCK_ACHIEVEMENTS.reduce(
    (sum, a) => sum + a.recipients,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Achievement Management
          </h1>
          <p className="text-muted-foreground">
            {activeCount} active achievements &middot;{' '}
            {totalRecipients.toLocaleString()} total awards issued
          </p>
        </div>
        <AwardDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_ACHIEVEMENTS.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
}
