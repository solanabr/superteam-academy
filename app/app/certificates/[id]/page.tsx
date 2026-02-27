import Link from 'next/link';
import { Header } from '@/components/Header';
import { CertificateView } from './CertificateView';

export const metadata = {
  title: 'Certificate',
  description: 'View your course completion certificate. Verify on Solana Explorer.',
};

export default async function CertificatePage() {
  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-2xl px-4 py-10 sm:px-6" tabIndex={-1}>
        <Link
          href="/dashboard"
          className="text-caption text-[rgb(var(--text-muted))] hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded focus-visible:outline-none"
        >
          ← Dashboard
        </Link>
        <div className="mt-8">
          <CertificateView />
        </div>
      </main>
    </>
  );
}
