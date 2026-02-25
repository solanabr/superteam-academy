"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useReviews } from "@/hooks/use-services";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import { Star, Trash2, Loader2, MessageSquarePlus } from "lucide-react";
import type { CourseProgress, CourseReview } from "@/types";

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "sm",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "xs" | "sm" | "md";
}) {
  const [hovered, setHovered] = useState(0);
  const sizeClass = size === "xs" ? "h-3.5 w-3.5" : size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className="flex gap-0.5" onMouseLeave={() => setHovered(0)}>
      {Array.from({ length: 5 }).map((_, i) => {
        const starIdx = i + 1;
        const filled = readonly ? starIdx <= value : starIdx <= (hovered || value);
        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            className={`${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
            onClick={() => onChange?.(starIdx)}
            onMouseEnter={() => !readonly && setHovered(starIdx)}
          >
            <Star
              className={`${sizeClass} ${
                filled
                  ? "text-amber-400 fill-amber-400"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

function ReviewCard({
  review,
  isOwn,
  onDelete,
}: {
  review: CourseReview;
  isOwn: boolean;
  onDelete: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const initial = review.author.displayName?.charAt(0) ?? review.author.username?.charAt(0) ?? "?";

  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {review.author.avatarUrl ? (
            <Image
              src={review.author.avatarUrl}
              alt={review.author.displayName}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {initial.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-medium">{review.author.displayName}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(review.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StarRating value={review.rating} readonly size="xs" />
          {isOwn && (
            <button
              onClick={async () => {
                setDeleting(true);
                try {
                  await onDelete();
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={deleting}
              className="text-muted-foreground hover:text-destructive transition-colors ml-1"
              title="Delete your review"
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
      {review.content && (
        <p className="text-sm text-muted-foreground">{review.content}</p>
      )}
    </div>
  );
}

function ReviewForm({
  existingReview,
  onSubmit,
}: {
  existingReview: CourseReview | null;
  onSubmit: (rating: number, content: string) => Promise<void>;
}) {
  const t = useTranslations("courses.detail.reviewForm");
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [content, setContent] = useState(existingReview?.content ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error(t("ratingRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(rating, content);
      toast.success(existingReview ? t("updated") : t("submitted"));
      if (!existingReview) {
        setRating(0);
        setContent("");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquarePlus className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium">
          {existingReview ? t("editTitle") : t("title")}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("yourRating")}:</span>
        <StarRating value={rating} onChange={setRating} size="md" />
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t("placeholder")}
        maxLength={1000}
        rows={3}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {content.length}/1000
        </span>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              {t("saving")}
            </>
          ) : existingReview ? (
            t("update")
          ) : (
            t("submit")
          )}
        </Button>
      </div>
    </div>
  );
}

export function CourseReviews({
  courseId,
  progress,
}: {
  courseId: string;
  progress: CourseProgress | null;
}) {
  const t = useTranslations("courses.detail");
  const { user } = useAuth();
  const { reviews, summary, userReview, loading, submitReview, deleteReview } =
    useReviews(courseId);

  const canReview = !!user && !!progress?.isCompleted;

  if (loading) {
    return (
      <div className="mt-8 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t("reviews")}</h2>
        {summary.count > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <StarRating value={Math.round(summary.avgRating)} readonly size="xs" />
            <span>
              {summary.avgRating} ({summary.count})
            </span>
          </div>
        )}
      </div>

      {/* Review form (only for users who completed the course) */}
      {canReview && (
        <ReviewForm existingReview={userReview} onSubmit={submitReview} />
      )}

      {/* Review list */}
      <div className="space-y-4">
        {reviews.length === 0 && !canReview && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {t("noReviews")}
          </p>
        )}
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            isOwn={review.userId === user?.id}
            onDelete={() => deleteReview(review.id)}
          />
        ))}
      </div>
    </div>
  );
}
