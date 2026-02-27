import Link from 'next/link';
import { Header } from '@/components/Header';
import { ProfilePublicView } from './ProfilePublicView';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  return {
    title: `${username} | Profile`,
    description: `Public profile for ${username} on Superteam Brazil LMS.`,
  };
}

export default async function ProfileUsernamePage({ params }: Props) {
  const { username } = await params;
  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-10 sm:px-6" tabIndex={-1}>
        <Link
          href="/leaderboard"
          className="text-caption text-[rgb(var(--text-muted))] hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded focus-visible:outline-none"
        >
          ← Leaderboard
        </Link>
        <div className="mt-6">
          <ProfilePublicView username={username} />
        </div>
      </main>
    </>
  );
}
