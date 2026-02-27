'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LogoLoader } from '@/components/ui/logo-loader';
import { DashboardSidebar, DashboardHeader } from '@/components/dashboard';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [statusTimedOut, setStatusTimedOut] = useState(false);

  useEffect(() => {
    if (status !== 'loading') {
      setStatusTimedOut(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setStatusTimedOut(true);
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [status]);

  useEffect(() => {
    let isActive = true;

    async function checkOnboarding() {
      if (status === 'loading' && !statusTimedOut) return;

      if (!session) {
        // Not authenticated - let auth handle redirect
        if (isActive) {
          setIsChecking(false);
        }
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch('/api/onboarding/status', {
          signal: controller.signal,
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();

          if (!data.isComplete) {
            // Redirect to onboarding if incomplete
            router.push('/onboarding');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Continue on error - middleware will handle it
      } finally {
        clearTimeout(timeoutId);
        if (isActive) {
          setIsChecking(false);
        }
      }
    }

    void checkOnboarding();

    return () => {
      isActive = false;
    };
  }, [session, status, statusTimedOut, router]);

  // Show loading state while checking onboarding status
  if (isChecking || (status === 'loading' && !statusTimedOut)) {
    return (
      <TooltipProvider>
        <div className="flex h-screen items-center justify-center">
          <LogoLoader size="lg" message="Verifying access..." />
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <DashboardHeader />

          {/* Page Content */}
          <main className="from-background via-background to-muted/20 flex-1 overflow-y-auto bg-gradient-to-br">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
