import { useTranslations } from 'next-intl';
import { Hero } from '@/components/landing/Hero';
import { StatsBar } from '@/components/landing/StatsBar';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { LearningPath } from '@/components/landing/LearningPath';
import { FinalCTA } from '@/components/landing/FinalCTA';

export default function HomePage() {
  return (
    <div className="flex flex-col w-full bg-[#0A0A0F]">
      <Hero />
      <StatsBar />
      <FeatureGrid />
      <LearningPath />
      <FinalCTA />
    </div>
  );
}
