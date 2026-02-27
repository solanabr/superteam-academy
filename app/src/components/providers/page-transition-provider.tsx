'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { PageTransitionLoader } from '@/components/ui/logo-loader';

function PageTransitionTracker({ onLoad }: { onLoad: (loading: boolean) => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    onLoad(true);
    const timer = setTimeout(() => {
      onLoad(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [pathname, searchParams, onLoad]);

  return null;
}

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadChange = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  // Intercept clicks on links to show loading immediately
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor && anchor.href) {
        const currentUrl = window.location.href;
        const targetUrl = anchor.href;

        // Check if it's an internal navigation (not external link or anchor)
        if (
          targetUrl.startsWith(window.location.origin) &&
          targetUrl !== currentUrl &&
          !targetUrl.includes('#') &&
          !anchor.hasAttribute('download') &&
          anchor.target !== '_blank'
        ) {
          // Show loading immediately when navigation link is clicked
          setIsLoading(true);
        }
      }
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PageTransitionTracker onLoad={handleLoadChange} />
      </Suspense>
      {isLoading && <PageTransitionLoader />}
      {children}
    </>
  );
}
