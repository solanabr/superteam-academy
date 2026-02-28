"use client";

import { useState, useMemo, useCallback } from "react";
import { Star, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn, getUserDisplayName, formatRelativeDate } from "@/lib/utils";

/** A single review persisted in localStorage. */
interface Review {
  name: string;
  rating: number;
  date: string;
  comment: string;
  isUser?: boolean;
}

/** Props for ReviewsSection */
export interface ReviewsSectionProps {
  courseSlug: string;
}

const REVIEWS_KEY_PREFIX = "sta_reviews:";

const SEED_REVIEWS: Review[] = [
  {
    name: "Rafael Costa",
    rating: 5,
    date: "2026-02-05",
    comment:
      "Excellent course! The hands-on challenges really helped me understand PDAs and account validation. The XP system is addictive.",
  },
  {
    name: "Maria Silva",
    rating: 5,
    date: "2026-01-18",
    comment:
      "Best Solana course I've taken. The content is well-structured and up-to-date. Loved the interactive code editor.",
  },
  {
    name: "Alex Chen",
    rating: 4,
    date: "2026-01-10",
    comment:
      "Great content and pacing. Would love to see more advanced topics covered. The credential I earned is a nice addition to my portfolio.",
  },
  {
    name: "Julia Ferreira",
    rating: 5,
    date: "2025-12-20",
    comment:
      "The streaks and achievements kept me motivated to finish. Really solid learning experience for anyone getting into Solana development.",
  },
];

function getStorageKey(courseSlug: string): string {
  return `${REVIEWS_KEY_PREFIX}${courseSlug}`;
}

function loadReviews(courseSlug: string): Review[] {
  if (typeof window === "undefined") return SEED_REVIEWS;
  try {
    const raw = localStorage.getItem(getStorageKey(courseSlug));
    if (raw) {
      const parsed = JSON.parse(raw) as Review[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return SEED_REVIEWS;
}

function saveReviews(courseSlug: string, reviews: Review[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(courseSlug), JSON.stringify(reviews));
}


/** Interactive star rating picker. */
function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}) {
  const [hover, setHover] = useState(0);
  const px = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const starNum = i + 1;
        const filled = starNum <= (hover || value);
        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            className={cn(
              "transition-colors",
              readonly ? "cursor-default" : "cursor-pointer"
            )}
            onMouseEnter={() => !readonly && setHover(starNum)}
            onMouseLeave={() => !readonly && setHover(0)}
            onClick={() => onChange?.(starNum)}
            aria-label={`${starNum} star${starNum !== 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                px,
                filled
                  ? "fill-brazil-gold text-brazil-gold"
                  : "text-muted-foreground/30"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

/** Aggregate rating bar for a single star level. */
function RatingBar({ count, total }: { count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-brazil-gold transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Write-a-review form. */
function ReviewForm({
  onSubmit,
}: {
  onSubmit: (rating: number, comment: string) => void;
}) {
  const t = useTranslations("courses.detail");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError(t("reviewSelectRating"));
      return;
    }
    if (comment.trim().length < 10) {
      setError(t("reviewMinLength"));
      return;
    }
    setError("");
    onSubmit(rating, comment.trim());
    setRating(0);
    setComment("");
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">{t("writeReview")}</h3>

      <div className="mt-3">
        <p className="mb-1.5 text-xs text-muted-foreground">{t("yourRating")}</p>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <div className="mt-4">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("reviewPlaceholder")}
          rows={3}
          maxLength={500}
          className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-st-green focus:outline-none focus:ring-1 focus:ring-st-green"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{comment.length}/500</p>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>

      <button
        type="submit"
        className="mt-3 rounded-lg bg-st-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-st-green-dark disabled:opacity-50"
      >
        {t("submitReview")}
      </button>
    </form>
  );
}

export function ReviewsSection({ courseSlug }: ReviewsSectionProps) {
  const t = useTranslations("courses.detail");
  const [reviews, setReviews] = useState<Review[]>(() => loadReviews(courseSlug));

  const hasUserReview = useMemo(
    () => reviews.some((r) => r.isUser),
    [reviews]
  );

  const { avg, distribution } = useMemo(() => {
    if (reviews.length === 0) return { avg: 0, distribution: [0, 0, 0, 0, 0] };
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++;
    });
    return { avg: sum / reviews.length, distribution: dist };
  }, [reviews]);

  const handleSubmit = useCallback(
    (rating: number, comment: string) => {
      const newReview: Review = {
        name: getUserDisplayName(),
        rating,
        date: new Date().toISOString().slice(0, 10),
        comment,
        isUser: true,
      };
      const updated = [newReview, ...reviews];
      setReviews(updated);
      saveReviews(courseSlug, updated);
    },
    [reviews, courseSlug]
  );

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-heading text-xl font-bold">{t("reviews")}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("reviewsCount", { count: reviews.length })}
      </p>

      {/* Aggregate Rating */}
      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center rounded-xl border border-border bg-card px-6 py-5">
          <span className="font-heading text-4xl font-bold">{avg.toFixed(1)}</span>
          <StarRating value={Math.round(avg)} readonly size="sm" />
          <p className="mt-1 text-xs text-muted-foreground">
            {t("reviewsCount", { count: reviews.length })}
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-right text-muted-foreground">{star}</span>
              <Star className="h-3 w-3 fill-brazil-gold text-brazil-gold" />
              <RatingBar count={distribution[star - 1]} total={reviews.length} />
              <span className="w-5 text-right text-muted-foreground">
                {distribution[star - 1]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Write a Review */}
      {!hasUserReview && (
        <div className="mt-6">
          <ReviewForm onSubmit={handleSubmit} />
        </div>
      )}

      {/* Review List */}
      <div className="mt-6 space-y-4">
        {reviews.map((review, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-st-green to-brazil-teal text-sm font-bold text-white">
                  {review.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {review.name}
                    {review.isUser && (
                      <span className="ml-2 rounded-full bg-st-green/10 px-2 py-0.5 text-xs font-medium text-st-green">
                        {t("you")}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeDate(review.date)}
                  </p>
                </div>
              </div>
              <StarRating value={review.rating} readonly size="sm" />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {review.comment}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
