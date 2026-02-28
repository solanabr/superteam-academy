'use client';

import { useCallback, useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StarRatingProps {
  /** Current rating value (1-5) */
  value: number;
  /** Callback when rating changes (only in interactive mode) */
  onChange?: (value: number) => void;
  /** Whether the component is read-only */
  readOnly?: boolean;
  /** Size of each star in pixels */
  size?: number;
  /** Additional class name */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 20,
  className,
}: StarRatingProps) {
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleClick = useCallback(
    (star: number) => {
      if (readOnly || !onChange) return;
      onChange(star);
    },
    [readOnly, onChange],
  );

  const handleMouseEnter = useCallback(
    (star: number) => {
      if (readOnly) return;
      setHoveredStar(star);
    },
    [readOnly],
  );

  const handleMouseLeave = useCallback(() => {
    if (readOnly) return;
    setHoveredStar(0);
  }, [readOnly]);

  const displayValue = hoveredStar || value;

  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      onMouseLeave={handleMouseLeave}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={`Rating: ${value} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1;
        const isFilled = star <= displayValue;

        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            className={cn(
              'transition-colors',
              readOnly
                ? 'cursor-default'
                : 'cursor-pointer hover:scale-110 active:scale-95',
            )}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            role={readOnly ? undefined : 'radio'}
            aria-checked={readOnly ? undefined : star === value}
          >
            <Star
              size={size}
              className={cn(
                'transition-colors',
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-muted-foreground/40',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
