import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { LearningPaths } from "@/components/landing/learning-paths";
import { Stats } from "@/components/landing/stats";
import { Footer } from "@/components/landing/footer";

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Stats />
        <Features />
        <LearningPaths />
      </main>
      <Footer />
    </>
  );
}
