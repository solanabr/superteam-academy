'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Wrapper component that adds a fade-in + slide-up transition to page content.
 * Uses Tailwind transition utilities and mounts via requestAnimationFrame
 * to ensure the CSS transition triggers on first render.
 *
 * Respects prefers-reduced-motion automatically via Tailwind's
 * `motion-reduce:` variant (instant snap without animation).
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out motion-reduce:transition-none',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        className,
      )}
    >
      {children}
    </div>
  );
}
