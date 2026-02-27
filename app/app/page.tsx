import { Header } from '@/components/Header';
import { HomeContent } from '@/components/HomeContent';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Superteam Brazil LMS',
  description: 'Learning Management System dApp for Superteam Brazil Academy. Connect your Solana wallet to track progress across courses.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://superteam-brazil-lms.vercel.app',
  applicationCategory: 'EducationalApplication',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  author: { '@type': 'Organization', name: 'Superteam Brazil', url: 'https://x.com/superteambr' },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main id="main-content" className="mx-auto min-w-0 max-w-5xl px-3 py-8 sm:px-6 sm:py-12" tabIndex={-1}>
        <HomeContent />
      </main>
    </>
  );
}
