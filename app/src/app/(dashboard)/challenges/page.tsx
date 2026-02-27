'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks';
import {
  Flame,
  Search,
  BookOpen,
  Trophy,
  Clock,
  Star,
  Code,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface Challenge {
  id: string;
  slug?: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  xpReward: number;
  timeEstimate: number;
  completed: boolean;
  attempts: number;
  courseId?: string;
  courseTitle?: string;
  language?: string;
  tags?: string[];
}

interface ChallengeStats {
  total: number;
  completed: number;
  inProgress: number;
  xpEarned: number;
}

export default function ChallengesPage() {
  const { t } = useTranslation();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [category, setCategory] = useState<'all' | string>('all');

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (difficulty !== 'all') params.append('difficulty', difficulty);
        if (category !== 'all') params.append('category', category);

        const response = await fetch(`/api/challenges?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch challenges');
        }

        const data = await response.json();
        setChallenges(data.challenges || []);
        setCategories(data.categories || []);
        setStats(data.stats || null);
      } catch (err) {
        console.error('Error fetching challenges:', err);
        setError(err instanceof Error ? err.message : 'Failed to load challenges');
        setChallenges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [difficulty, category]);

  const filteredChallenges = challenges.filter((challenge) => {
    const matchesSearch =
      challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      challenge.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const allCategories = ['all', ...categories];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'hard':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    const renderStars = (count: number) => (
      <span className="ml-1 inline-flex items-center gap-0.5 align-middle">
        {Array.from({ length: count }).map((_, index) => (
          <Star key={index} className="h-3 w-3 fill-current" />
        ))}
      </span>
    );

    switch (difficulty) {
      case 'easy':
        return renderStars(1);
      case 'medium':
        return renderStars(2);
      case 'hard':
        return renderStars(3);
      default:
        return null;
    }
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <Code className="text-primary h-8 w-8" />
              Coding Challenges
            </h1>
            <p className="text-muted-foreground mt-2">
              Test your skills with hands-on coding challenges and earn XP
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Challenges</p>
                <p className="text-2xl font-bold">{stats?.total || challenges.length}</p>
              </div>
              <Code className="text-muted-foreground h-8 w-8 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Completed</p>
                <p className="text-2xl font-bold">{stats?.completed || 0}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">In Progress</p>
                <p className="text-2xl font-bold">{stats?.inProgress || 0}</p>
              </div>
              <Flame className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">XP Earned</p>
                <p className="text-2xl font-bold">{stats?.xpEarned || 0}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 md:max-w-md">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search challenges..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="border-input bg-background rounded-md border px-3 py-2 text-sm"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border-input bg-background rounded-md border px-3 py-2 text-sm"
              >
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Challenges List */}
      {loading ? (
        <Card>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="animate-spin" />
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-8 text-center">
            <p className="text-destructive font-medium">{error}</p>
            <p className="text-muted-foreground mt-2 text-sm">
              Please try refreshing the page or contact support if the problem persists.
            </p>
          </CardContent>
        </Card>
      ) : filteredChallenges.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No challenges found matching your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredChallenges.map((challenge) => (
            <Card key={challenge.id} className="transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{challenge.title}</h3>
                      {challenge.completed && (
                        <Badge variant="outline" className="gap-1">
                          <Trophy className="h-3 w-3" />
                          Completed
                        </Badge>
                      )}
                      <Badge className={getDifficultyColor(challenge.difficulty)}>
                        {challenge.difficulty.charAt(0).toUpperCase() +
                          challenge.difficulty.slice(1)}{' '}
                        {getDifficultyIcon(challenge.difficulty)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3 text-sm">{challenge.description}</p>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        <span>{challenge.category}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span>{challenge.timeEstimate} mins</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{challenge.xpReward} XP</span>
                      </div>
                    </div>
                  </div>

                  <Button asChild className="gap-2">
                    <Link href={`/challenges/${challenge.id}`}>
                      {challenge.completed ? 'View' : 'Start'} Challenge
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
