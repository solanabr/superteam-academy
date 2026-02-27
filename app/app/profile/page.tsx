import { Header } from '@/components/Header';
import { ProfileShell } from '@/components/ProfileShell';

export default function ProfilePage() {
  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-10 sm:px-6" tabIndex={-1}>
        <h1 id="profile-heading" className="text-title font-semibold text-[rgb(var(--text))]">
          Profile
        </h1>
        <p className="text-body mt-1 text-[rgb(var(--text-muted))]" id="profile-desc">
          Public profile and achievements. Connect your wallet to see your stats.
        </p>
        <ProfileShell />
      </main>
    </>
  );
}
