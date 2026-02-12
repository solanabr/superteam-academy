'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { userProfiles, courses, onChainCredentials, getRankTitle } from '@/lib/mock-data';
import { RadarChart } from '@/components/profile/radar-chart';
import { BadgeGrid } from '@/components/profile/badge-grid';
import { CredentialCard } from '@/components/profile/credential-card';
import { Badge } from '@/components/ui/badge';

export default function UserProfilePage() {
  const t = useTranslations('profile');
  const params = useParams();
  const username = params.username as string;

  const user = userProfiles.find((u) => u.username === username);

  if (!user) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold">{t('notFound')}</h1>
      </div>
    );
  }

  if (!user.isProfilePublic) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold">{t('privateProfile')}</h1>
      </div>
    );
  }

  const completedCourses = courses.filter((c) => user.completedCourseIds.includes(c.slug));

  return (
    <div className="container py-8">
      {/* Profile Header */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 text-3xl font-bold text-white">
          {user.displayName.charAt(0)}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <h1 className="text-2xl font-bold">{user.displayName}</h1>
            <Badge variant="secondary">{t('levelBadge', { level: user.level })}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">@{user.username}</p>
          <p className="mt-2 max-w-lg text-sm">{user.bio}</p>
          <div className="mt-2 flex items-center justify-center gap-4 text-sm text-muted-foreground sm:justify-start">
            <span>{t('joined')} {new Date(user.joinDate).toLocaleDateString()}</span>
            <span>{getRankTitle(user.level)}</span>
            {user.socialLinks.github && (
              <a href={`https://github.com/${user.socialLinks.github}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                GitHub
              </a>
            )}
            {user.socialLinks.twitter && (
              <a href={`https://twitter.com/${user.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                Twitter
              </a>
            )}
          </div>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-2xl font-bold">{user.totalXP.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">XP</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{user.currentStreak}</p>
            <p className="text-xs text-muted-foreground">🔥 {t('streakLabel')}</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{user.earnedBadgeIds.length}</p>
            <p className="text-xs text-muted-foreground">{t('badges')}</p>
          </div>
        </div>
      </div>

      {/* Skills Radar */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">{t('skills')}</h3>
          <RadarChart skills={user.skills} />
        </div>

        {/* Credentials */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('credentials')}</h3>
          {onChainCredentials.length > 0 ? (
            onChainCredentials.map((cred) => (
              <CredentialCard key={cred.id} credential={cred} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{t('noCredentials')}</p>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="mt-8">
        <BadgeGrid earnedBadgeIds={user.earnedBadgeIds} showAll />
      </div>

      {/* Completed Courses */}
      {completedCourses.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold">{t('completedCourses')}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedCourses.map((course) => (
              <div key={course.slug} className="rounded-xl border bg-card p-4">
                <h4 className="font-medium">{course.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{course.xp} XP {t('earned')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
