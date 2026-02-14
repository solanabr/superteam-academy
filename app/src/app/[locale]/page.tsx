import { useTranslations } from 'next-intl';
import { HeroSection } from '@/components/HeroSection';
import { FeaturesSection } from '@/components/FeaturesSection';
import { PopularCourses } from '@/components/PopularCourses';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <PopularCourses />
    </div>
  );
}