"use client";

import { useTranslations } from "next-intl";
import { Star } from "@phosphor-icons/react";
import { Facehash } from "facehash";
import { mockReviews } from "@/lib/data/reviews-mock";
import { getAvatarColors } from "@/lib/avatar-colors";

export function CourseReviews() {
  const t = useTranslations("courseDetail");
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-lg font-semibold">{t("reviews")}</h2>
      <ul className="divide-y divide-border">
        {mockReviews.map((review) => (
          <li key={review.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
            <Facehash
              name={review.author}
              size={36}
              showInitial={false}
              colors={getAvatarColors(review.author)}
              className="shrink-0 rounded-full ring-2 ring-border dark:ring-white/25 overflow-hidden"
              aria-hidden
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{review.author}</span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={
                        i < review.rating
                          ? "size-3.5 fill-secondary text-secondary"
                          : "size-3.5 text-muted-foreground/40"
                      }
                      weight={i < review.rating ? "fill" : "regular"}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                &ldquo;{review.quote}&rdquo;
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
