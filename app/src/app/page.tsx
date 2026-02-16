import Link from "next/link";
import { getCourses } from "@/sanity/lib/queries";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const courses = await getCourses();
  const hasCourses = courses.length > 0;

  return (
    <div className="relative flex-1">
      <main className="mx-auto flex max-w-6xl flex-col items-center px-4 py-20 md:py-28">
        <div className="flex max-w-3xl flex-col items-center gap-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wider text-text-secondary">
            <span className="h-2 w-2 rounded-full bg-solana animate-pulse" />
            Decentralized learning on Solana
          </span>
          <h1 className="font-display text-text-primary text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            Master Solana at the{" "}
            <span className="bg-gradient-to-r from-solana via-white to-rust bg-clip-text text-transparent">
              metal level
            </span>
          </h1>
          <p className="text-text-secondary max-w-xl text-lg leading-relaxed">
            The definitive learning environment for the Solana ecosystem. Learn Rust, Anchor, and
            security through interactive courses and verifiable credentials.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-solana font-semibold text-void hover:bg-solana/90">
              <Link href="/courses">
                {hasCourses ? "Explore courses" : "Start learning"}
                <span className="ml-2 opacity-80">→</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/20">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>

        {hasCourses && (
          <section className="mt-24 w-full max-w-4xl">
            <h2 className="font-display text-text-primary mb-6 text-xl font-semibold">
              Learning paths
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.slice(0, 3).map((course) => (
                <Link
                  key={course._id}
                  href={`/courses/${course.slug}`}
                  className="glass-panel hover:border-solana/30 flex flex-col gap-2 rounded-lg border p-4 transition-colors"
                >
                  <span className="font-display text-text-primary text-lg font-medium">
                    {course.title}
                  </span>
                  {course.description && (
                    <p className="text-text-secondary line-clamp-2 text-sm">{course.description}</p>
                  )}
                  <span className="text-solana text-sm">View course →</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
