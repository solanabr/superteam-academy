'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { MessageSquare, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/ui/star-rating';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Review {
  id: string;
  wallet: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface CourseReviewsProps {
  courseId: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function getStorageKey(courseId: string): string {
  return `reviews-${courseId}`;
}

function loadReviews(courseId: string): Review[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(getStorageKey(courseId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Review[];
  } catch {
    return [];
  }
}

function saveReviews(courseId: string, reviews: Review[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getStorageKey(courseId), JSON.stringify(reviews));
}

// ---------------------------------------------------------------------------
// Seed data — pre-populated demo reviews for first-time visitors
// ---------------------------------------------------------------------------

function getSeedReviews(courseId: string): Review[] {
  return [
    {
      id: `seed-${courseId}-1`,
      wallet: '7xKX...m9Fp',
      rating: 5,
      comment:
        'Excellent introduction to Solana development. The hands-on exercises with Anchor really solidified my understanding of PDAs and CPIs. Highly recommend for anyone transitioning from EVM.',
      createdAt: '2025-12-15T10:30:00Z',
    },
    {
      id: `seed-${courseId}-2`,
      wallet: '3qRt...vB2n',
      rating: 4,
      comment:
        'Great course structure and pacing. The token program section was particularly well-explained. Would love to see more advanced error handling patterns covered in future updates.',
      createdAt: '2026-01-08T14:20:00Z',
    },
    {
      id: `seed-${courseId}-3`,
      wallet: '9mNp...kD4x',
      rating: 5,
      comment:
        'This is exactly what I needed to go from zero to deploying my first program on devnet. The credential NFT at the end was a nice motivator. Earned my first soulbound token!',
      createdAt: '2026-02-02T09:15:00Z',
    },
  ];
}

// ---------------------------------------------------------------------------
// Truncate wallet address
// ---------------------------------------------------------------------------

function truncateWallet(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Format date
// ---------------------------------------------------------------------------

function formatReviewDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CourseReviews({ courseId, className }: CourseReviewsProps) {
  const t = useTranslations('reviews');
  const { publicKey, connected } = useWallet();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load reviews from localStorage (or seed if empty)
  useEffect(() => {
    const stored = loadReviews(courseId);
    if (stored.length > 0) {
      setReviews(stored);
    } else {
      const seeds = getSeedReviews(courseId);
      saveReviews(courseId, seeds);
      setReviews(seeds);
    }
  }, [courseId]);

  // Computed values
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  }, [reviews]);

  const currentWallet = publicKey?.toBase58() ?? '';
  const hasReviewed = useMemo(
    () => reviews.some((r) => r.wallet === currentWallet),
    [reviews, currentWallet],
  );

  // Submit handler
  const handleSubmit = useCallback(() => {
    if (newRating === 0) {
      toast.error(t('rating_required'));
      return;
    }

    if (hasReviewed) {
      toast.error(t('already_reviewed'));
      return;
    }

    setIsSubmitting(true);

    // Simulate brief async delay for UX
    setTimeout(() => {
      const review: Review = {
        id: crypto.randomUUID(),
        wallet: currentWallet,
        rating: newRating,
        comment: newComment.trim(),
        createdAt: new Date().toISOString(),
      };

      const updated = [review, ...reviews];
      saveReviews(courseId, updated);
      setReviews(updated);
      setNewRating(0);
      setNewComment('');
      setIsSubmitting(false);

      toast.success(t('review_submitted'), {
        description: t('review_submitted_desc'),
      });
    }, 400);
  }, [
    newRating,
    newComment,
    currentWallet,
    reviews,
    courseId,
    hasReviewed,
    t,
  ]);

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Average rating summary */}
      {reviews.length > 0 && (
        <Card>
          <CardContent className="flex items-center gap-4 px-4 py-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-bold tabular-nums">
                {averageRating.toFixed(1)}
              </span>
              <StarRating value={Math.round(averageRating)} readOnly size={16} />
              <span className="text-muted-foreground text-xs">
                {reviews.length}{' '}
                {reviews.length === 1 ? 'review' : 'reviews'}
              </span>
            </div>

            <Separator orientation="vertical" className="h-16" />

            {/* Rating distribution */}
            <div className="flex flex-1 flex-col gap-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r) => r.rating === star).length;
                const pct =
                  reviews.length > 0 ? (count / reviews.length) * 100 : 0;

                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground w-3 text-right tabular-nums">
                      {star}
                    </span>
                    <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground w-6 tabular-nums">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Write a review */}
      {connected && !hasReviewed && (
        <Card>
          <CardContent className="flex flex-col gap-4 px-4 py-4">
            <h4 className="text-sm font-semibold">{t('write_review')}</h4>

            <div className="flex flex-col gap-1.5">
              <label className="text-muted-foreground text-xs font-medium">
                {t('your_rating')}
              </label>
              <StarRating value={newRating} onChange={setNewRating} size={24} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-muted-foreground text-xs font-medium">
                {t('your_comment')}
              </label>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('comment_placeholder')}
                rows={3}
                className="resize-none"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || newRating === 0}
              className="w-full sm:w-auto sm:self-end"
            >
              {isSubmitting ? t('submitting') : t('submit')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Wallet not connected prompt */}
      {!connected && (
        <Card>
          <CardContent className="flex items-center gap-3 px-4 py-4">
            <Wallet className="text-muted-foreground size-5 shrink-0" />
            <p className="text-muted-foreground text-sm">
              {t('connect_to_review')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <MessageSquare className="text-muted-foreground size-10" />
          <p className="text-muted-foreground text-sm">{t('no_reviews')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single review card
// ---------------------------------------------------------------------------

function ReviewCard({ review }: { review: Review }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StarRating value={review.rating} readOnly size={14} />
            <span className="text-muted-foreground font-mono text-xs">
              {truncateWallet(review.wallet)}
            </span>
          </div>
          <time className="text-muted-foreground text-xs">
            {formatReviewDate(review.createdAt)}
          </time>
        </div>

        {review.comment && (
          <p className="text-sm leading-relaxed">{review.comment}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Hook: get review count for tab label
// ---------------------------------------------------------------------------

export function useReviewCount(courseId: string): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const stored = loadReviews(courseId);
    if (stored.length > 0) {
      setCount(stored.length);
    } else {
      // Seed data has 3 reviews
      setCount(3);
    }
  }, [courseId]);

  return count;
}
