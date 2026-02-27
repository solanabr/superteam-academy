import { Header } from '@/components/Header';
import { DashboardContent } from './DashboardContent';

export const metadata = {
  title: 'My progress',
  description: 'View your learning progress across Superteam Brazil Academy courses. Connect your Solana wallet to track completed lessons.',
};

export default function DashboardPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-5xl px-4 py-10 sm:px-6" tabIndex={-1}>
        <h1 className="text-title mb-2 font-semibold text-[rgb(var(--text))]">
          My progress
        </h1>
        <p className="text-body mb-8 text-[rgb(var(--text-muted))]">
          Your learning progress is stored per wallet. Connect to see your completed lessons and continue where you left off.
        </p>
        <DashboardContent />
      </main>
    </>
  );
}
