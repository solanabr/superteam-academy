"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getAllInstructors as getInstructorsSync } from "@/data/instructors";
import type { Instructor } from "@/data/instructors";

function InstructorCard({ instructor }: { instructor: Instructor }) {
  return (
    <Link
      href={`/instructors/${instructor.slug}`}
      className="block w-[340px] shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded-2xl"
    >
      <Card className="instructor-card h-full overflow-hidden rounded-2xl border-4 border-[hsl(var(--brand-logo-green))] transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5">
        <CardHeader className="flex flex-row items-start gap-4 pb-2 pt-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-sky-600 bg-muted">
            <Image
              src={instructor.avatar}
              alt={instructor.name}
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">{instructor.name}</p>
            {instructor.specialties && instructor.specialties.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {instructor.specialties.map((s) => (
                  <span
                    key={s}
                    className="rounded bg-[hsl(var(--brand-logo-yellow))] px-2 py-0.5 text-xs font-medium text-[hsl(0,0%,9%)]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="line-clamp-2 text-sm text-black">{instructor.bio}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

type InstructorsCarouselProps = {
  title?: string;
  subtitle?: string;
  instructors?: Instructor[];
};

export function InstructorsCarousel({
  title,
  subtitle,
  instructors: instructorsProp,
}: InstructorsCarouselProps) {
  const instructors = instructorsProp ?? getInstructorsSync();
  /* Múltiplas cópias para loop infinito contínuo sem salto visível */
  const duplicated = [
    ...instructors,
    ...instructors,
    ...instructors,
    ...instructors,
  ];

  return (
    <section
      className="relative overflow-hidden py-16"
      aria-label={title ?? "Instrutores"}
    >
      {(title ?? subtitle) && (
        <div className="mb-8 text-center">
          {title && (
            <h2 className="text-2xl font-bold tracking-tight text-[#008c4C] drop-shadow-md sm:text-3xl">
              {title}
            </h2>
          )}
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className="instructors-carousel-container relative w-full overflow-hidden">
        <div className="instructors-carousel-track flex gap-6">
          {duplicated.map((instructor, i) => (
            <InstructorCard
              key={`${instructor.slug}-${i}`}
              instructor={instructor}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
