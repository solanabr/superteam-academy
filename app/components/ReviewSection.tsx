'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  walletAddress: string;
  rating: number;
  text: string;
  createdAt: string;
}

interface ReviewSectionProps {
  slug: string;
  locale: string;
  title: string;
  staticReviews: { author: string; rating: number; date: string; text: Record<string, string> }[];
}

export default function ReviewSection({ slug, locale, title, staticReviews }: ReviewSectionProps) {
  const [apiReviews, setApiReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    fetch(`/api/courses/${slug}/reviews`)
      .then(r => r.json())
      .then(data => {
        if (data.reviews) {
          setApiReviews(data.reviews);
          setAvgRating(data.averageRating);
        }
      })
      .catch(() => {});
  }, [slug]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/courses/${slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: 'anonymous-' + Math.random().toString(36).slice(2, 8),
          rating: newRating,
          text: newText,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setApiReviews(prev => [...prev, data.review]);
        setSubmitted(true);
        setNewText('');
      }
    } finally {
      setSubmitting(false);
    }
  }, [slug, newRating, newText, submitting]);

  const L = (obj: Record<string, string>) => obj[locale] ?? obj['pt-BR'];

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-white flex items-center gap-2">
        <Star className="h-5 w-5 text-yellow-400" />
        {title}
        {avgRating > 0 && (
          <span className="text-sm font-normal text-gray-400 ml-2">({avgRating.toFixed(1)} avg)</span>
        )}
      </h2>
      <div className="space-y-4">
        {staticReviews.map((r, i) => (
          <div key={`static-${i}`} className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-700 to-indigo-700 flex items-center justify-center text-xs font-bold text-white">
                  {r.author[0]}
                </div>
                <span className="text-sm font-medium text-gray-300">{r.author}</span>
              </div>
              <span className="text-xs text-gray-500">{r.date}</span>
            </div>
            <div className="flex gap-0.5 mb-2">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className={cn('h-3.5 w-3.5', j < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700')} />
              ))}
            </div>
            <p className="text-sm text-gray-400">{L(r.text)}</p>
          </div>
        ))}

        {apiReviews.map((r) => (
          <div key={r.id} className="rounded-2xl border border-purple-800/30 bg-purple-900/10 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-xs font-bold text-white">
                  {r.walletAddress[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-300">{r.walletAddress.slice(0, 8)}...</span>
              </div>
              <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex gap-0.5 mb-2">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className={cn('h-3.5 w-3.5', j < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700')} />
              ))}
            </div>
            {r.text && <p className="text-sm text-gray-400">{r.text}</p>}
          </div>
        ))}

        {/* Review form */}
        {!submitted ? (
          <div className="rounded-2xl border border-gray-700 bg-gray-900/60 p-5 space-y-3">
            <p className="text-sm font-medium text-gray-300">Leave a review</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setNewRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star className={cn(
                    'h-6 w-6 transition-colors',
                    star <= (hoverRating || newRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'
                  )} />
                </button>
              ))}
            </div>
            <textarea
              value={newText}
              onChange={e => setNewText(e.target.value)}
              rows={3}
              placeholder="Share your experience..."
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-600 resize-none"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50 transition-all"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-green-800/30 bg-green-900/10 p-5 text-center">
            <p className="text-sm text-green-400">Thank you for your review!</p>
          </div>
        )}
      </div>
    </section>
  );
}
