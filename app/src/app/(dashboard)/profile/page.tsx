'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useTranslation } from '@/hooks';
import { useWalletContext, useAuth } from '@/components/providers';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

// Helper function to get user initials
function getUserInitials(name?: string | null): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
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
  Copy,
  Settings,
  Share2,
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
  Clock,
} from 'lucide-react';
import { getLucideIcon } from '@/lib/icon-utils';

interface ProfileData {
  user: {
    id: string;
    displayName?: string;
    username?: string;
    email?: string;
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
    profilePublic: boolean;
    showOnLeaderboard: boolean;
  };
  achievements: any[];
  certificates: any[];
  completedCourses: any[];
  activityHistory: any[];
  skills: { skill: string; level: number }[];
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { connected, address } = useWalletContext();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tabParam || 'achievements');
  const [isProfilePublic, setIsProfilePublic] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [isSharingProfile, setIsSharingProfile] = useState(false);

  // Update active tab when URL changes
  useEffect(() => {
    if (tabParam && ['achievements', 'certificates', 'courses', 'activity'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Update local state when profile data loads
  useEffect(() => {
    if (profileData?.user?.profilePublic !== undefined) {
      setIsProfilePublic(profileData.user.profilePublic);
    }
  }, [profileData]);

  // Handle visibility toggle
  const handleVisibilityToggle = async (checked: boolean) => {
    setIsProfilePublic(checked);
    setSavingVisibility(true);
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePublic: checked }),
      });
    } catch (error) {
      console.error('Failed to update visibility:', error);
      setIsProfilePublic(!checked); // Revert on error
    } finally {
      setSavingVisibility(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/profile');
        if (!response.ok) throw new Error('Failed to fetch profile');
        const data = await response.json();
        setProfileData(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (connected) {
      fetchProfile();
    }
  }, [connected]);

  const displayAddress = address || '';
  const truncatedAddress = displayAddress
    ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}`
    : '';

  const copyAddress = () => {
    if (displayAddress) {
      navigator.clipboard.writeText(displayAddress);
    }
  };

  const handleShareProfile = async () => {
    if (!profileData?.user?.username) {
      toast.error('Set a username in Settings to share your public profile.');
      return;
    }

    if (!isProfilePublic) {
      toast.error('Enable Public Profile to share your profile link.');
      return;
    }

    setIsSharingProfile(true);

    try {
      const shareUrl = `${window.location.origin}/profile/${profileData.user.username}`;
      const shareTitle = `${
        profileData.user.displayName || profileData.user.username || 'Learner'
      } on CapySolBuild`;
      const shareText = `Level ${profileData.user.level || 1} • ${(profileData.user.totalXP || 0).toLocaleString()} XP • ${profileData.user.coursesCompleted || 0} courses completed`;

      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(`${shareTitle}\n${shareText}\n${shareUrl}`);
      toast.success('Public profile link copied to clipboard.');
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error('Failed to share profile. Please try again.');
      }
    } finally {
      setIsSharingProfile(false);
    }
  };

  if (!connected) {
    return (
      <div className="container py-20">
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <CardTitle>{t('profile.connectWallet')}</CardTitle>
            <CardDescription>{t('profile.connectDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg">{t('common.connectWallet')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container flex justify-center py-20">
        <LoadingSpinner size={48} message={t('common.loading')} />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container py-20">
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load profile data</CardDescription>
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
                <AvatarImage src={profileData?.user.avatarUrl || user?.image || undefined} />
                <AvatarFallback className="text-3xl">
                  {getUserInitials(profileData?.user.displayName || user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold">
                  {profileData?.user.displayName || profileData?.user.username || 'User'}
                </h1>
                <div className="text-muted-foreground mt-1 flex items-center gap-2">
                  <code className="bg-muted rounded px-2 py-1 text-sm">{truncatedAddress}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                    <a
                      href={`https://explorer.solana.com/address/${displayAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Bio & Links */}
            <div className="flex-1">
              <p className="text-muted-foreground mb-4">
                {profileData?.user.bio || 'No bio available'}
              </p>
              <div className="text-muted-foreground mb-4 flex flex-wrap gap-4 text-sm">
                {profileData?.user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profileData?.user.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {t('profile.joined')}{' '}
                  {new Date(profileData?.user.joinedDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2">
                {(() => {
                  const socialLinks = [
                    {
                      key: 'website',
                      value: profileData?.user.website,
                      href: profileData?.user.website,
                      icon: Globe,
                      label: 'Website',
                    },
                    {
                      key: 'twitter',
                      value: profileData?.user.twitter,
                      href: profileData?.user.twitter
                        ? `https://twitter.com/${profileData.user.twitter.replace('@', '')}`
                        : undefined,
                      icon: Twitter,
                      label: 'Twitter',
                    },
                    {
                      key: 'github',
                      value: profileData?.user.github,
                      href: profileData?.user.github
                        ? `https://github.com/${profileData.user.github.replace('@', '')}`
                        : undefined,
                      icon: Github,
                      label: 'GitHub',
                    },
                    {
                      key: 'linkedin',
                      value: profileData?.user.linkedin,
                      href: profileData?.user.linkedin
                        ? profileData.user.linkedin.startsWith('http')
                          ? profileData.user.linkedin
                          : `https://linkedin.com/in/${profileData.user.linkedin.replace('@', '')}`
                        : undefined,
                      icon: Linkedin,
                      label: 'LinkedIn',
                    },
                    {
                      key: 'facebook',
                      value: profileData?.user.facebook,
                      href: profileData?.user.facebook
                        ? profileData.user.facebook.startsWith('http')
                          ? profileData.user.facebook
                          : `https://facebook.com/${profileData.user.facebook.replace('@', '')}`
                        : undefined,
                      icon: Facebook,
                      label: 'Facebook',
                    },
                    {
                      key: 'instagram',
                      value: profileData?.user.instagram,
                      href: profileData?.user.instagram
                        ? profileData.user.instagram.startsWith('http')
                          ? profileData.user.instagram
                          : `https://instagram.com/${profileData.user.instagram.replace('@', '')}`
                        : undefined,
                      icon: Instagram,
                      label: 'Instagram',
                    },
                    {
                      key: 'whatsapp',
                      value: profileData?.user.whatsapp,
                      href: profileData?.user.whatsapp
                        ? `https://wa.me/${profileData.user.whatsapp.replace(/[^\d]/g, '')}`
                        : undefined,
                      icon: MessageCircle,
                      label: 'WhatsApp',
                    },
                    {
                      key: 'telegram',
                      value: profileData?.user.telegram,
                      href: profileData?.user.telegram
                        ? profileData.user.telegram.startsWith('http')
                          ? profileData.user.telegram
                          : `https://t.me/${profileData.user.telegram.replace('@', '')}`
                        : undefined,
                      icon: Send,
                      label: 'Telegram',
                    },
                    {
                      key: 'discord',
                      value: profileData?.user.discord,
                      href: undefined,
                      icon: MessageCircle,
                      label: 'Discord',
                    },
                    {
                      key: 'medium',
                      value: profileData?.user.medium,
                      href: profileData?.user.medium
                        ? profileData.user.medium.startsWith('http')
                          ? profileData.user.medium
                          : `https://medium.com/@${profileData.user.medium.replace('@', '')}`
                        : undefined,
                      icon: PenSquare,
                      label: 'Medium',
                    },
                    {
                      key: 'youtube',
                      value: profileData?.user.youtube,
                      href: profileData?.user.youtube,
                      icon: Youtube,
                      label: 'YouTube',
                    },
                    {
                      key: 'tiktok',
                      value: profileData?.user.tiktok,
                      href: profileData?.user.tiktok
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

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button variant="outline" asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  {t('profile.editProfile')}
                </Link>
              </Button>
              <Button variant="outline" onClick={handleShareProfile} disabled={isSharingProfile}>
                <Share2 className="mr-2 h-4 w-4" />
                {isSharingProfile ? 'Sharing...' : t('profile.shareProfile')}
              </Button>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            <div className="text-center">
              <div className="text-primary text-2xl font-bold">
                {(profileData?.user.totalXP || 0).toLocaleString()}
              </div>
              <div className="text-muted-foreground text-sm">{t('profile.totalXP')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{profileData?.user.level || 1}</div>
              <div className="text-muted-foreground text-sm">{t('profile.level')}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-orange-500">
                <Flame className="h-5 w-5" />
                {profileData?.user.currentStreak || 0}
              </div>
              <div className="text-muted-foreground text-sm">{t('profile.dayStreak')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {profileData?.user.coursesCompleted || 0}
              </div>
              <div className="text-muted-foreground text-sm">{t('profile.courses')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {profileData?.certificates?.length || 0}
              </div>
              <div className="text-muted-foreground text-sm">{t('profile.certificates')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills & Settings Row */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* Skill Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              {t('profile.skills')}
            </CardTitle>
            <CardDescription>Your proficiency across different domains</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(profileData?.skills || []).map((skill) => (
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
              {(!profileData?.skills || profileData.skills.length === 0) && (
                <div className="space-y-3 py-4 text-center">
                  <p className="text-muted-foreground text-sm">
                    Not enough learning data yet. Complete courses to build your skill profile.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/discover">Discover Courses</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* On-Chain Credentials & Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-500" />
              {t('profile.credentials')}
            </CardTitle>
            <CardDescription>Your on-chain credentials and privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Wallet Credentials */}
            <div>
              <h4 className="mb-3 text-sm font-medium">On-Chain Credentials</h4>
              {address ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-blue-500/20 p-2">
                        <Award className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Solana Academy Credential</p>
                        <p className="text-muted-foreground text-xs">
                          Level {profileData?.user.level || 1} • {profileData?.user.totalXP || 0} XP
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={`https://explorer.solana.com/address/${address}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Your credential NFT evolves as you progress. Track, level, and completed courses
                    are stored on-chain.
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Connect your wallet to view on-chain credentials
                </p>
              )}
            </div>

            <Separator />

            {/* Privacy Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Privacy Settings</h4>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="profile-public" className="text-sm font-medium">
                    Public Profile
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Allow others to view your profile at /profile/
                    {profileData?.user.username || 'username'}
                  </p>
                </div>
                <Switch
                  id="profile-public"
                  checked={isProfilePublic}
                  onCheckedChange={handleVisibilityToggle}
                  disabled={savingVisibility}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="achievements">{t('profile.achievements')}</TabsTrigger>
          <TabsTrigger value="certificates">{t('profile.certificates')}</TabsTrigger>
          <TabsTrigger value="courses">{t('profile.completedCourses')}</TabsTrigger>
          <TabsTrigger value="activity">{t('profile.activity')}</TabsTrigger>
        </TabsList>

        {/* Achievements Tab */}
        <TabsContent value="achievements" id="achievements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                {t('profile.achievements')}
              </CardTitle>
              <CardDescription>
                {profileData?.achievements?.filter((a: any) => a.earned).length || 0}/
                {profileData?.achievements?.length || 0} {t('profile.unlocked')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(profileData?.achievements || []).map((achievement: any) => (
                  <div
                    key={achievement.id}
                    className={`flex items-start gap-4 rounded-lg border p-4 ${
                      !achievement.earned ? 'opacity-50 grayscale' : ''
                    }`}
                  >
                    <div>
                      {(() => {
                        const Icon = getLucideIcon(achievement.icon);
                        return <Icon className="h-8 w-8" />;
                      })()}
                    </div>
                    <div className="flex-1">
                      <h4 className="flex items-center gap-2 font-semibold">
                        {achievement.name}
                        {achievement.earned && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      </h4>
                      <p className="text-muted-foreground text-sm">{achievement.description}</p>
                      {achievement.earned && achievement.earnedAt && (
                        <span className="text-muted-foreground text-xs">
                          {new Date(achievement.earnedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                {t('profile.certificates')}
              </CardTitle>
              <CardDescription>{t('profile.certificatesDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(profileData?.certificates || []).map((cert: any) => (
                  <Card key={cert.id} className="overflow-hidden">
                    <div className="from-primary/20 to-primary/5 flex aspect-video items-center justify-center bg-gradient-to-br">
                      <Award className="text-primary/50 h-16 w-16" />
                    </div>
                    <CardContent className="pt-4">
                      <h4 className="font-semibold">{cert.courseTitle || 'Certificate'}</h4>
                      <p className="text-muted-foreground text-sm">
                        {t('profile.issued')}: {new Date(cert.issuedAt).toLocaleDateString()}
                      </p>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm" asChild className="flex-1">
                          <Link href={`/certificates/${cert.id}`}>{t('profile.view')}</Link>
                        </Button>
                        {cert.certificateUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
                {profileData?.completedCourses?.length || 0} {t('profile.coursesCompleted')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(profileData?.completedCourses || []).map((course: any) => (
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
                          {t('profile.completed')}:{' '}
                          {new Date(course.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/courses/${course.slug}`}>{t('profile.review')}</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('profile.recentActivity')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(profileData?.activityHistory || []).map((activity: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="bg-muted rounded-full p-2">
                      {activity.type === 'lesson_completed' && <BookOpen className="h-4 w-4" />}
                      {activity.type === 'lesson_started' && <Code className="h-4 w-4" />}
                      {activity.type === 'challenge' && <Code className="h-4 w-4" />}
                      {activity.type === 'achievement' && <Award className="h-4 w-4" />}
                      {activity.type === 'streak' && <Flame className="h-4 w-4 text-orange-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.title}</p>
                      <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <span className="text-yellow-600">+{activity.xp || 0} XP</span>
                        <span>•</span>
                        <span>{new Date(activity.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
