"use client";

import {
  HeroSection,
  FeaturesSection,
  CoursesSection,
  AssessmentSection,
  LeaderboardSection,
  TestimonialsSection,
  Footer,
} from "@/components/landing";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <CoursesSection />
        <AssessmentSection />
        <LeaderboardSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  );
}

