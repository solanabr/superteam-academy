'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useTranslation } from '@/hooks';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Trophy,
  Flame,
  Star,
  Award,
  Calendar,
  Zap,
  Code,
  CheckCircle2,
  ExternalLink,
  Twitter,
  Github,
  Globe,
  Linkedin,
  Facebook,
  Instagram,
  MessageCircle,
  Send,
  Youtube,
  Music2,
  PenSquare,
  MapPin,
  Lock,
  UserX,
} from 'lucide-react';
import { getLucideIcon } from '@/lib/icon-utils';

// Helper function to get user initials
function getUserInitials(name?: string | null): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface PublicProfileData {
  user: {
    id: string;
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    bio?: string;
    location?: string;
    website?: string;
    twitter?: string;
    github?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
    telegram?: string;
    discord?: string;
    medium?: string;
    youtube?: string;
    tiktok?: string;
    totalXP: number;
    level: number;
    coursesCompleted: number;
    currentStreak: number;
    joinedDate: string;
  };
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earned: boolean;
    earnedAt?: string;
  }>;
  completedCourses: Array<{
    id: string;
    title: string;
    slug: string;
    completedAt: string;
  }>;
  skills: Array<{ skill: string; level: number }>;
}

export default function PublicProfilePage() {
  const { t } = useTranslation();
  const params = useParams();
  const username = params.username as string;
  const [profileData, setProfileData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('achievements');

  useEffect(() => {
    const fetchPublicProfile = async () => {
      if (!username) return;

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/profile/${username}`);
        if (response.status === 404) {
          setError('User not found');
          return;
        }
        if (response.status === 403) {
          setError('This profile is private');
          return;
        }
        if (!response.ok) throw new Error('Failed to fetch profile');
        const data = await response.json();
        setProfileData(data);
      } catch (err) {
        console.error('Error fetching public profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="container flex justify-center py-20">
        <LoadingSpinner size={48} message={t('common.loading')} />
      </div>
    );
  }

  if (error === 'User not found') {
    return (
      <div className="container py-20">
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <UserX className="h-8 w-8 text-gray-400" />
            </div>
            <CardTitle>User Not Found</CardTitle>
            <CardDescription>
              The user @{username} doesn&apos;t exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/leaderboard">View Leaderboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error === 'This profile is private') {
    return (
      <div className="container py-20">
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Lock className="h-8 w-8 text-gray-400" />
            </div>
            <CardTitle>Private Profile</CardTitle>
            <CardDescription>@{username} has chosen to keep their profile private.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/leaderboard">View Leaderboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="container py-20">
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error || 'Failed to load profile'}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Profile Header */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 md:flex-row">
            {/* Avatar & Basic Info */}
            <div className="flex flex-col items-center gap-4 md:items-start">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profileData.user.avatarUrl || undefined} />
                <AvatarFallback className="text-3xl">
                  {getUserInitials(profileData.user.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold">
                  {profileData.user.displayName || profileData.user.username || 'User'}
                </h1>
                {profileData.user.username && (
                  <p className="text-muted-foreground">@{profileData.user.username}</p>
                )}
              </div>
            </div>

            {/* Bio & Links */}
            <div className="flex-1">
              <p className="text-muted-foreground mb-4">
                {profileData.user.bio || 'No bio available'}
              </p>
              <div className="text-muted-foreground mb-4 flex flex-wrap gap-4 text-sm">
                {profileData.user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profileData.user.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {t('profile.joined')} {new Date(profileData.user.joinedDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2">
                {(() => {
                  const socialLinks = [
                    {
                      key: 'website',
                      value: profileData.user.website,
                      href: profileData.user.website,
                      icon: Globe,
                      label: 'Website',
                    },
                    {
                      key: 'twitter',
                      value: profileData.user.twitter,
                      href: profileData.user.twitter
                        ? `https://twitter.com/${profileData.user.twitter.replace('@', '')}`
                        : undefined,
                      icon: Twitter,
                      label: 'Twitter',
                    },
                    {
                      key: 'github',
                      value: profileData.user.github,
                      href: profileData.user.github
                        ? `https://github.com/${profileData.user.github.replace('@', '')}`
                        : undefined,
                      icon: Github,
                      label: 'GitHub',
                    },
                    {
                      key: 'linkedin',
                      value: profileData.user.linkedin,
                      href: profileData.user.linkedin
                        ? profileData.user.linkedin.startsWith('http')
                          ? profileData.user.linkedin
                          : `https://linkedin.com/in/${profileData.user.linkedin.replace('@', '')}`
                        : undefined,
                      icon: Linkedin,
                      label: 'LinkedIn',
                    },
                    {
                      key: 'facebook',
                      value: profileData.user.facebook,
                      href: profileData.user.facebook
                        ? profileData.user.facebook.startsWith('http')
                          ? profileData.user.facebook
                          : `https://facebook.com/${profileData.user.facebook.replace('@', '')}`
                        : undefined,
                      icon: Facebook,
                      label: 'Facebook',
                    },
                    {
                      key: 'instagram',
                      value: profileData.user.instagram,
                      href: profileData.user.instagram
                        ? profileData.user.instagram.startsWith('http')
                          ? profileData.user.instagram
                          : `https://instagram.com/${profileData.user.instagram.replace('@', '')}`
                        : undefined,
                      icon: Instagram,
                      label: 'Instagram',
                    },
                    {
                      key: 'whatsapp',
                      value: profileData.user.whatsapp,
                      href: profileData.user.whatsapp
                        ? `https://wa.me/${profileData.user.whatsapp.replace(/[^\d]/g, '')}`
                        : undefined,
                      icon: MessageCircle,
                      label: 'WhatsApp',
                    },
                    {
                      key: 'telegram',
                      value: profileData.user.telegram,
                      href: profileData.user.telegram
                        ? profileData.user.telegram.startsWith('http')
                          ? profileData.user.telegram
                          : `https://t.me/${profileData.user.telegram.replace('@', '')}`
                        : undefined,
                      icon: Send,
                      label: 'Telegram',
                    },
                    {
                      key: 'discord',
                      value: profileData.user.discord,
                      href: undefined,
                      icon: MessageCircle,
                      label: 'Discord',
                    },
                    {
                      key: 'medium',
                      value: profileData.user.medium,
                      href: profileData.user.medium
                        ? profileData.user.medium.startsWith('http')
                          ? profileData.user.medium
                          : `https://medium.com/@${profileData.user.medium.replace('@', '')}`
                        : undefined,
                      icon: PenSquare,
                      label: 'Medium',
                    },
                    {
                      key: 'youtube',
                      value: profileData.user.youtube,
                      href: profileData.user.youtube,
                      icon: Youtube,
                      label: 'YouTube',
                    },
                    {
                      key: 'tiktok',
                      value: profileData.user.tiktok,
                      href: profileData.user.tiktok
                        ? profileData.user.tiktok.startsWith('http')
                          ? profileData.user.tiktok
                          : `https://www.tiktok.com/@${profileData.user.tiktok.replace('@', '')}`
                        : undefined,
                      icon: Music2,
                      label: 'TikTok',
                    },
                  ].filter((item) => item.value);

                  return socialLinks.map((item) => {
                    const Icon = item.icon;
                    if (item.href) {
                      return (
                        <Button key={item.key} variant="outline" size="sm" asChild>
                          <a href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label}>
                            <Icon className="h-4 w-4" />
                          </a>
                        </Button>
                      );
                    }

                    return (
                      <Button key={item.key} variant="outline" size="sm" disabled aria-label={item.label}>
                        <Icon className="h-4 w-4" />
                      </Button>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-primary text-2xl font-bold">
                {(profileData.user.totalXP || 0).toLocaleString()}
              </div>
              <div className="text-muted-foreground text-sm">{t('profile.totalXP')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{profileData.user.level || 1}</div>
              <div className="text-muted-foreground text-sm">{t('profile.level')}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-orange-500">
                <Flame className="h-5 w-5" />
                {profileData.user.currentStreak || 0}
              </div>
              <div className="text-muted-foreground text-sm">{t('profile.dayStreak')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {profileData.user.coursesCompleted || 0}
              </div>
              <div className="text-muted-foreground text-sm">{t('profile.courses')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Card */}
      {profileData.skills && profileData.skills.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {profileData.skills.map((skill) => (
                <div key={skill.skill} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{skill.skill}</span>
                    <span className="text-muted-foreground">{skill.level}/100</span>
                  </div>
                  <div className="bg-muted h-3 overflow-hidden rounded-full">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="achievements">{t('profile.achievements')}</TabsTrigger>
          <TabsTrigger value="courses">{t('profile.completedCourses')}</TabsTrigger>
        </TabsList>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                {t('profile.achievements')}
              </CardTitle>
              <CardDescription>
                {profileData.achievements?.filter((a) => a.earned).length || 0} achievements earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(profileData.achievements || [])
                  .filter((a) => a.earned)
                  .map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-start gap-4 rounded-lg border p-4"
                    >
                      <div>
                        {(() => {
                          const Icon = getLucideIcon(achievement.icon);
                          return <Icon className="h-8 w-8 text-yellow-500" />;
                        })()}
                      </div>
                      <div className="flex-1">
                        <h4 className="flex items-center gap-2 font-semibold">
                          {achievement.name}
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </h4>
                        <p className="text-muted-foreground text-sm">{achievement.description}</p>
                        {achievement.earnedAt && (
                          <span className="text-muted-foreground text-xs">
                            {new Date(achievement.earnedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                {(!profileData.achievements ||
                  profileData.achievements.filter((a) => a.earned).length === 0) && (
                  <p className="text-muted-foreground col-span-full py-8 text-center">
                    No achievements earned yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed Courses Tab */}
        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {t('profile.completedCourses')}
              </CardTitle>
              <CardDescription>
                {profileData.completedCourses?.length || 0} courses completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(profileData.completedCourses || []).map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-green-500/10 p-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{course.title}</h4>
                        <p className="text-muted-foreground text-sm">
                          Completed: {new Date(course.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/courses/${course.slug}`}>View Course</Link>
                    </Button>
                  </div>
                ))}
                {(!profileData.completedCourses || profileData.completedCourses.length === 0) && (
                  <p className="text-muted-foreground py-8 text-center">No courses completed yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
