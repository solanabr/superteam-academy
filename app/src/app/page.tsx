import { CourseCard } from "@/components/course/course-card";
import { Button } from "@/components/ui/button";
import { landingTestimonials, mockCourses } from "@/lib/data/mock-courses";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const featured = mockCourses.slice(0, 3);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f1422] via-[#11192c] to-[#121622] p-8 sm:p-12">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(153,69,255,0.2)_45%,transparent_100%)]" />
        <div className="relative max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#14F195]/40 bg-[#14F195]/10 px-3 py-1 text-xs text-[#14F195]">
            <Sparkles className="size-3.5" />
            Solana-native learning stack
          </div>
          <h1 className="text-3xl font-semibold text-white sm:text-5xl">
            Level up your Solana skills with on-chain learning.
          </h1>
          <p className="max-w-2xl text-zinc-300">
            Track progress, earn XP on devnet-compatible rails, and unlock verifiable credentials while shipping real dApps.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black">
              <Link href="/courses">
                Start learning
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 bg-transparent text-white">
              <Link href="/dashboard">View dashboard</Link>
            </Button>
          </div>
          <div className="grid max-w-xl grid-cols-3 gap-3 pt-3">
            <Stat label="Active learners" value="9.2k" />
            <Stat label="Courses live" value="6" />
            <Stat label="Credentials minted" value="1.8k" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">Featured learning tracks</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((course) => (
            <CourseCard key={course.id} course={course} enrolled={false} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">What learners are shipping</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {landingTestimonials.map((item) => (
            <article key={item.name} className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
              <p className="text-sm leading-relaxed text-zinc-200">“{item.quote}”</p>
              <p className="mt-4 text-sm font-semibold text-zinc-100">{item.name}</p>
              <p className="text-xs text-zinc-400">{item.role}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/55 p-3">
      <p className="text-2xl font-semibold text-zinc-100">{value}</p>
      <p className="text-xs text-zinc-400">{label}</p>
    </div>
  );
}
