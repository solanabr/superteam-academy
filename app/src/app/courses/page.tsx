import Link from "next/link";
import { getCourses } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";

const TRACKS = [
  { value: "all", label: "All" },
  { value: "solana", label: "Solana" },
  { value: "rust", label: "Rust" },
  { value: "anchor", label: "Anchor" },
  { value: "security", label: "Security" },
  { value: "other", label: "Other" },
];

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string; q?: string }>;
}) {
  const params = await searchParams;
  const trackFilter = params.track && params.track !== "all" ? params.track : undefined;
  const query = params.q?.trim();

  const courses = await getCourses();
  const filtered = courses.filter((c) => {
    if (trackFilter && c.track !== trackFilter) return false;
    if (query) {
      const lower = query.toLowerCase();
      return (
        c.title.toLowerCase().includes(lower) ||
        (c.description?.toLowerCase().includes(lower) ?? false)
      );
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-text-primary text-2xl font-semibold">Curriculum</h1>
      <p className="text-text-secondary mt-1 text-sm">
        Browse courses and start learning. Progress is saved when you’re logged in.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {TRACKS.map(({ value, label }) => (
            <Link
              key={value}
              href={value === "all" ? "/courses" : `/courses?track=${value}`}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                (trackFilter ?? "all") === value
                  ? "border-solana bg-solana/10 text-solana"
                  : "border-border-subtle text-text-secondary hover:border-white/20 hover:text-text-primary"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <form method="GET" action="/courses" className="flex gap-2">
          {params.track && <input type="hidden" name="track" value={params.track} />}
          <input
            type="search"
            name="q"
            placeholder="Search courses..."
            defaultValue={params.q}
            className="border-border-subtle bg-void text-text-primary placeholder:text-text-secondary w-48 rounded-md border px-3 py-1.5 text-sm focus:border-solana focus:outline-none focus:ring-1 focus:ring-solana"
          />
          <button
            type="submit"
            className="rounded-md bg-white/5 px-3 py-1.5 text-sm text-text-primary hover:bg-white/10"
          >
            Search
          </button>
        </form>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel mt-8 flex flex-col items-center justify-center gap-4 rounded-lg border py-16 text-center">
          <p className="text-text-secondary">
            {courses.length === 0
              ? "No courses published yet. Add a course in Sanity Studio (/studio) and publish it."
              : "No courses match your filters."}
          </p>
          <Link
            href="/courses"
            className="text-solana text-sm hover:underline"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <Link
              key={course._id}
              href={`/courses/${course.slug}`}
              className="glass-panel hover:border-solana/40 group flex flex-col overflow-hidden rounded-lg border transition-all"
            >
              <div className="bg-muted relative aspect-video w-full shrink-0">
                {course.image?.asset?._ref ? (
                  <Image
                    src={urlFor(course.image).width(400).height(225).url()}
                    alt=""
                    width={400}
                    height={225}
                    className="object-cover transition-transform group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="from-solana/10 to-rust/10 flex h-full w-full items-center justify-center bg-gradient-to-br">
                    <span className="text-text-secondary text-4xl opacity-50">⌘</span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                {course.track && (
                  <span className="text-solana text-xs font-medium uppercase tracking-wider">
                    {course.track}
                  </span>
                )}
                <h2 className="font-display text-text-primary text-lg font-semibold group-hover:text-solana">
                  {course.title}
                </h2>
                {course.description && (
                  <p className="text-text-secondary line-clamp-2 flex-1 text-sm">
                    {course.description}
                  </p>
                )}
                <div className="text-text-secondary mt-auto flex flex-wrap gap-3 text-xs">
                  {course.difficulty && <span>{course.difficulty}</span>}
                  {course.duration && <span>{course.duration}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
