/**
 * Logo-based Loading Components
 *
 * Uses the project logo with animations for all loading states across the application.
 *
 * Components:
 * - LogoLoader: Animated logo with optional message (inline use)
 * - LoadingOverlay: Full-screen overlay with logo (modal/overlay use)
 * - PageTransitionLoader: Full-page loading for route transitions
 *
 * Usage:
 * ```tsx
 * // Inline loading
 * <LogoLoader size="md" message="Loading..." />
 *
 * // Full-screen overlay
 * <LoadingOverlay message="Processing..." size="lg" />
 *
 * // Page transitions (handled automatically by PageTransitionProvider)
 * <PageTransitionLoader />
 * ```
 */

'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | string;
  message?: string;
  className?: string;
}

const sizeMap = {
  sm: { logo: 32, container: 'gap-2', text: 'text-xs' },
  md: { logo: 48, container: 'gap-3', text: 'text-sm' },
  lg: { logo: 64, container: 'gap-4', text: 'text-base' },
  xl: { logo: 96, container: 'gap-5', text: 'text-lg' },
  '2xl': { logo: 128, container: 'gap-6', text: 'text-xl' },
};

export function LogoLoader({ size = 'md', message, className }: LogoLoaderProps) {
  const normalizedSize = (size || 'md').toLowerCase().trim();
  const selectedSize = sizeMap[normalizedSize as keyof typeof sizeMap] ?? sizeMap.md;
  const { logo, container, text } = selectedSize;

  return (
    <div className={cn('flex flex-col items-center justify-center', container, className)}>
      {/* Animated Logo */}
      <div className="relative">
        {/* Spinning Ring */}
        <div
          className="border-primary/20 border-t-primary absolute inset-0 animate-spin rounded-full border-4"
          style={{
            width: logo + 16,
            height: logo + 16,
            top: -8,
            left: -8,
          }}
        />

        {/* Logo with Pulse Animation */}
        <div className="animate-pulse-slow">
          <Image
            src="/logo.png"
            alt="CapySolBuild Academy"
            width={logo}
            height={logo}
            priority
            className="rounded-lg"
          />
        </div>
      </div>

      {/* Loading Message */}
      {message && (
        <p className={cn('text-muted-foreground animate-pulse font-medium', text)}>{message}</p>
      )}
    </div>
  );
}

// Full-screen loading overlay
interface LoadingOverlayProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function LoadingOverlay({ message = 'Loading...', size = 'lg' }: LoadingOverlayProps) {
  return (
    <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <LogoLoader size={size} message={message} />
    </div>
  );
}

// Page transition loading
export function PageTransitionLoader() {
  return (
    <div className="bg-background fixed inset-0 z-50 flex items-center justify-center">
      <LogoLoader size="2xl" message="Loading..." />
    </div>
  );
}
