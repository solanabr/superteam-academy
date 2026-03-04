"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useNotificationStore } from "@/stores/notification-store";
import { useAchievementTrigger } from "@/hooks/useAchievementTrigger";

export interface CourseReview {
  id: string;
  author: string; // display name or truncated wallet
  rating: number; // 1-5
  comment: string;
  date: string; // ISO date
}

function getStorageKey(courseSlug: string) {
  return `superteam-reviews-${courseSlug}`;
}

function loadReviews(courseSlug: string): CourseReview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(courseSlug));
    return raw ? (JSON.parse(raw) as CourseReview[]) : [];
  } catch {
    return [];
  }
}

function saveReviews(courseSlug: string, reviews: CourseReview[]) {
  try {
    localStorage.setItem(getStorageKey(courseSlug), JSON.stringify(reviews));
  } catch {
    // ignore quota errors
  }
}

function StarRating({
  rating,
  max = 5,
  interactive = false,
  onRate,
}: {
  rating: number;
  max?: number;
  interactive?: boolean;
  onRate?: (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of ${max} stars`}
    >
      {Array.from({ length: max }).map((_, i) => {
        const filled = interactive ? (hovered || rating) > i : rating > i;
        return (
          <Star
            key={i}
            className={`h-4 w-4 transition-colors ${
              filled
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted text-muted-foreground/30"
            } ${interactive ? "cursor-pointer" : ""}`}
            aria-hidden="true"
            onMouseEnter={interactive ? () => setHovered(i + 1) : undefined}
            onMouseLeave={interactive ? () => setHovered(0) : undefined}
            onClick={interactive && onRate ? () => onRate(i + 1) : undefined}
          />
        );
      })}
    </div>
  );
}

interface ReviewFormProps {
  authorName: string;
  onSubmit: (review: CourseReview) => void;
}

function ReviewForm({ authorName, onSubmit }: ReviewFormProps) {
  const t = useTranslations("reviews");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const handleSubmit = () => {
    if (rating === 0 || comment.trim().length === 0) return;
    setSubmitting(true);
    const review: CourseReview = {
      id: crypto.randomUUID(),
      author: authorName,
      rating,
      comment: comment.trim(),
      date: new Date().toISOString(),
    };
    onSubmit(review);
    addNotification({
      type: "achievement_unlocked",
      title: t("submitted"),
      message: t("submittedMessage"),
    });
    setRating(0);
    setComment("");
    setSubmitting(false);
  };

  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <p className="text-sm font-medium">{t("writeReview")}</p>
        <div className="flex items-center gap-2">
          <StarRating rating={rating} interactive onRate={setRating} />
          {rating > 0 && (
            <span className="text-xs text-muted-foreground">{rating}/5</span>
          )}
        </div>
        <Textarea
          placeholder={t("commentPlaceholder")}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
          className="resize-none text-sm"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {comment.length}/1000
          </span>
          <Button
            size="sm"
            disabled={rating === 0 || comment.trim().length === 0 || submitting}
            onClick={handleSubmit}
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            {t("submitReview")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  } catch {
    return isoDate;
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface CourseReviewsProps {
  courseSlug: string;
  /** Optional seed reviews (e.g. from CMS). User-submitted reviews are merged from localStorage. */
  initialReviews?: CourseReview[];
}

function mergeReviews(stored: CourseReview[], seed: CourseReview[]): CourseReview[] {
  // User reviews first (most recent), then seed (de-dup by id)
  const existingIds = new Set(stored.map((r) => r.id));
  const deduped = seed.filter((r) => !existingIds.has(r.id));
  return [...stored, ...deduped];
}

export function CourseReviews({ courseSlug, initialReviews = [] }: CourseReviewsProps) {
  const t = useTranslations("reviews");
  const { data: session } = useSession();
  const { checkFirstReview } = useAchievementTrigger();
  // Lazy initializer: merge localStorage + seed on first render (runs only client-side)
  const [reviews, setReviews] = useState<CourseReview[]>(() => {
    const stored = loadReviews(courseSlug);
    return stored.length > 0 ? mergeReviews(stored, initialReviews) : initialReviews;
  });
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (review: CourseReview) => {
    const updated = [review, ...reviews];
    setReviews(updated);
    // Persist only user-submitted reviews (not initialReviews seeds)
    const storedIds = new Set(initialReviews.map((r) => r.id));
    const toStore = updated.filter((r) => !storedIds.has(r.id));
    saveReviews(courseSlug, toStore);
    setShowForm(false);
    // Check first_comment achievement
    void checkFirstReview();
  };

  const authorName =
    session?.user?.name ?? "Anonymous Learner";

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;
  const averageRounded = Math.round(averageRating * 10) / 10;

  return (
    <div className="space-y-6">
      <Separator />

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">{t("title")}</h2>
            {totalReviews > 0 ? (
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-3xl font-bold">{averageRounded}</span>
                  <div className="flex flex-col gap-0.5">
                    <StarRating rating={Math.round(averageRating)} />
                    <span className="text-xs text-muted-foreground">
                      {t("totalReviews", { count: totalReviews })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">{t("noReviews")}</p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => setShowForm((v) => !v)}
            title={session ? t("writeReview") : t("connectToReview")}
          >
            <Star className="mr-2 h-4 w-4" aria-hidden="true" />
            {session ? t("writeReview") : t("connectToReview")}
          </Button>
        </div>

        {/* Review submission form */}
        {showForm && session && (
          <ReviewForm
            authorName={authorName}
            onSubmit={handleSubmit}
          />
        )}

        {/* Review list */}
        {totalReviews > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
                      aria-hidden="true"
                    >
                      {getInitials(review.author)}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{review.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(review.date)}
                        </span>
                      </div>
                      <StarRating rating={review.rating} />
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border py-10 text-center">
            <Star className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" aria-hidden="true" />
            <p className="text-sm font-medium">{t("beFirst")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("noReviews")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
