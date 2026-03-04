import LandingHeader from "@/components/landing/header-static";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { LearningPaths } from "@/components/landing/learning-paths";
import { Stats } from "@/components/landing/stats";
import { Testimonials } from "@/components/landing/testimonials";
import { Footer } from "@/components/landing/footer";

export const revalidate = 3600;

export default function Page() {
  return (
    <>
      <LandingHeader />
      <main>
        <Hero />
        <Stats />
        <Features />
        <Testimonials />
        <LearningPaths />
      </main>
      <Footer />
    </>
  );
}
