"use client";

import { Card } from "@/components/ui/card";
import { useLocale } from "@/providers/locale-provider";

function TestimonialCard({
  name,
  role,
  text,
}: {
  name: string;
  role: string;
  text: string;
}) {
  return (
    <Card className="w-[320px] shrink-0 border-border/50 bg-card/80 backdrop-blur-sm p-5 gap-3">
      <p className="text-sm leading-relaxed text-muted-foreground">
        &ldquo;{text}&rdquo;
      </p>
      <div className="mt-auto flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
    </Card>
  );
}

export function SocialProof() {
  const { t } = useLocale();

  const stats = [
    { value: "2,400+", label: t("landing.statsStudents") },
    { value: "57", label: t("landing.statsLessonsLive") },
    { value: "12K+", label: t("landing.statsXpMinted") },
    { value: "340+", label: t("landing.statsCredentialsEarned") },
  ];

  const testimonials = [
    {
      name: "Lucas M.",
      role: t("landing.testimonial1Role"),
      text: t("landing.testimonial1Text"),
    },
    {
      name: "Priya S.",
      role: t("landing.testimonial2Role"),
      text: t("landing.testimonial2Text"),
    },
    {
      name: "Carlos R.",
      role: t("landing.testimonial3Role"),
      text: t("landing.testimonial3Text"),
    },
    {
      name: "Sofia K.",
      role: t("landing.testimonial4Role"),
      text: t("landing.testimonial4Text"),
    },
    {
      name: "James T.",
      role: t("landing.testimonial5Role"),
      text: t("landing.testimonial5Text"),
    },
    {
      name: "Ana P.",
      role: t("landing.testimonial6Role"),
      text: t("landing.testimonial6Text"),
    },
    {
      name: "Dev N.",
      role: t("landing.testimonial7Role"),
      text: t("landing.testimonial7Text"),
    },
    {
      name: "Maria L.",
      role: t("landing.testimonial8Role"),
      text: t("landing.testimonial8Text"),
    },
  ];

  // Duplicate testimonials for seamless infinite scroll
  const row1 = testimonials.slice(0, 4);
  const row2 = testimonials.slice(4);

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-glow-center animate-drift-1" />

      <div className="relative z-10">
        {/* Heading + Stats */}
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              {t("landing.socialHeading")}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t("landing.socialSubtitle")}
            </p>
          </div>

          {/* Stats row */}
          <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-border/50 bg-card/60 backdrop-blur-sm px-4 py-5 text-center"
              >
                <div className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
                  {stat.value}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-20">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {t("landing.lovedByStudents")}
          </p>

          {/* Scrolling strip - row 1 (left) */}
          <div className="mt-8 relative h-[156px] overflow-hidden" aria-hidden="true">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-background to-transparent" />

            <div className="flex gap-5 animate-marquee-left">
              {[...row1, ...row1].map((item, i) => (
                <TestimonialCard key={i} {...item} />
              ))}
            </div>
          </div>

          {/* Scrolling strip - row 2 (right) */}
          <div className="mt-5 relative h-[156px] overflow-hidden" aria-hidden="true">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-background to-transparent" />

            <div className="flex gap-5 animate-marquee-right">
              {[...row2, ...row2].map((item, i) => (
                <TestimonialCard key={i} {...item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
