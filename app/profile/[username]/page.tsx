import { PublicProfilePageClient } from '@/components/profile/public-profile-page-client';
import { UserProfile } from '@/lib/types';

function profileFromUsername(username: string): UserProfile {
  const sanitized = username.trim();
  const today = new Date().toISOString().split('T')[0];

  return {
    id: sanitized.toLowerCase(),
    username: sanitized.toLowerCase(),
    displayName: sanitized,
    bio: '',
    avatarUrl: '/avatars/default.png',
    joinedAt: today,
    social: {},
    skills: [
      { name: 'Rust', value: 0 },
      { name: 'Anchor', value: 0 },
      { name: 'Frontend', value: 0 },
      { name: 'Security', value: 0 },
      { name: 'Protocol Design', value: 0 }
    ],
    badges: [],
    completedCourseIds: [],
    publicProfile: true
  };
}

export default function PublicProfilePage({ params }: { params: { username: string } }): JSX.Element {
  const profile = profileFromUsername(params.username);
  return <PublicProfilePageClient profile={profile} />;
}
