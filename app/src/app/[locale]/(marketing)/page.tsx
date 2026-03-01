import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturedCourses } from '@/components/landing/featured-courses';
import { HowItWorks } from '@/components/landing/how-it-works';
import { TracksOverview } from '@/components/landing/tracks-overview';
import { GamificationPreview } from '@/components/landing/gamification-preview';
import { SocialProof } from '@/components/landing/social-proof';
import { CtaBanner } from '@/components/landing/cta-banner';
import { getOrganizationJsonLd } from '@/lib/utils/json-ld';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('landing');

  return {
    title: t('hero_title'),
    description: t('hero_subtitle'),
  };
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getOrganizationJsonLd()),
        }}
      />
      <HeroSection />
      <FeaturedCourses />
      <HowItWorks />
      <TracksOverview />
      <GamificationPreview />
      <SocialProof />
      <CtaBanner />
    </>
  );
}
