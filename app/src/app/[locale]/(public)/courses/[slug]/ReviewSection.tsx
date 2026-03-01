"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Star, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useProfile } from "@/hooks/useProfile";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Review {
  id: string;
  wallet_address: string;
  display_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

function StarRating({ rating, interactive = false, onChange }: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 transition-colors ${(interactive ? (hover || rating) >= s : rating >= s) ? "fill-[#F5A623] text-[#F5A623]" : "text-border"} ${interactive ? "cursor-pointer" : ""}`}
          onClick={() => interactive && onChange?.(s)}
          onMouseEnter={() => interactive && setHover(s)}
          onMouseLeave={() => interactive && setHover(0)}
        />
      ))}
    </div>
  );
}

function ReviewModal({ courseSlug, onClose, onSubmitted }: { courseSlug: string; onClose: () => void; onSubmitted: () => void }) {
  const { publicKey } = useWallet();
  const profile = useProfile();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!publicKey || rating === 0) return;
    setSubmitting(true);
    setError(null);
    const wallet = publicKey.toBase58();
    const displayName = profile?.display_name ?? profile?.username
      ?? (wallet.slice(0, 6) + "..." + wallet.slice(-4));
    const { error: err } = await supabase.from("course_reviews").upsert({
      course_slug: courseSlug,
      wallet_address: wallet,
      display_name: displayName,
      rating,
      comment: comment.trim() || null,
    }, { onConflict: "course_slug,wallet_address" });
    setSubmitting(false);
    if (err) { setError(err.message); return; }
    onSubmitted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg w-full max-w-md p-6 space-y-5">
        <div>
          <h3 className="font-mono text-base font-semibold text-foreground">Rate this course</h3>
          <p className="text-xs font-mono text-muted-foreground mt-1">Your review helps other learners.</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-mono text-muted-foreground">Rating *</p>
          <StarRating rating={rating} interactive onChange={setRating} />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-mono text-muted-foreground">Comment (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you think about this course?"
            rows={4}
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-[#14F195]/50 transition-colors"
          />
        </div>

        {error && <p className="text-xs font-mono text-red-400">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#14F195] text-black text-xs font-mono font-semibold rounded-full hover:bg-[#0D9E61] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}

export function RateCourseButton({ courseSlug, totalLessons }: { courseSlug: string; totalLessons: number }) {
  const { publicKey } = useWallet();
  const [allDone, setAllDone] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const ids: string[] = JSON.parse(localStorage.getItem(`completed_${courseSlug}`) ?? "[]");
      setAllDone(ids.length >= totalLessons && totalLessons > 0);
    } catch {}
  }, [courseSlug, totalLessons]);

  if (!allDone || !publicKey) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-center gap-1.5 mt-2 py-2.5 border border-[#F5A623]/40 bg-[#F5A623]/5 text-[#F5A623] text-sm font-mono font-semibold rounded-full hover:bg-[#F5A623]/10 transition-colors"
      >
        {submitted ? <><CheckCircle className="h-3.5 w-3.5" /> Review submitted</> : <><Star className="h-3.5 w-3.5" /> Rate this course</>}
      </button>
      {showModal && (
        <ReviewModal
          courseSlug={courseSlug}
          onClose={() => setShowModal(false)}
          onSubmitted={() => setSubmitted(true)}
        />
      )}
    </>
  );
}

export function StudentReviews({ courseSlug }: { courseSlug: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("course_reviews")
      .select("*")
      .eq("course_slug", courseSlug)
      .order("created_at", { ascending: false })
      .limit(20);
    setReviews(data ?? []);
    setLoading(false);
  }, [courseSlug]);

  useEffect(() => { load(); }, [load]);

  const avg = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="font-mono text-lg font-semibold text-foreground">Student Reviews</h2>
        {avg && (
          <div className="flex items-center gap-1.5 font-mono text-sm">
            <span className="text-[#14F195] font-bold">{avg}</span>
            <span className="text-muted-foreground">/ 5</span>
            <span className="text-subtle text-xs">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 bg-elevated rounded animate-pulse" />)}
        </div>
      )}

      {!loading && reviews.length === 0 && (
        <p className="text-sm font-mono text-muted-foreground">No reviews yet. Complete the course to leave the first one!</p>
      )}

      {!loading && reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-card border border-border rounded p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-elevated border border-border-hover flex items-center justify-center text-[10px] font-mono font-semibold text-foreground shrink-0">
                  {(review.display_name ?? "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-mono font-semibold text-foreground">{review.display_name ?? "Anonymous"}</span>
                  <StarRating rating={review.rating} />
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground leading-relaxed pl-10">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
