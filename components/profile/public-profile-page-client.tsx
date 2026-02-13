'use client';

import { SkillRadar } from '@/components/profile/skill-radar';
import { useI18n } from '@/components/i18n/i18n-provider';
import { UserProfile } from '@/lib/types';

export function PublicProfilePageClient({ profile }: { profile: UserProfile }): JSX.Element {
  const { dictionary } = useI18n();

  return (
    <div className="space-y-6">
      <header className="panel">
        <h1 className="text-3xl font-extrabold">{profile.displayName}</h1>
        <p className="mt-2 text-sm text-foreground/75">{dictionary.publicProfile.bio}</p>
      </header>

      <SkillRadar profile={profile} />

      <section className="panel p-5">
        <h2 className="text-lg font-semibold">{dictionary.publicProfile.badgesTitle}</h2>
        {profile.badges.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.badges.map((badge) => (
              <span key={badge} className="chip">
                {badge}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-foreground/75">{dictionary.publicProfile.noBadges}</p>
        )}
      </section>
    </div>
  );
}
