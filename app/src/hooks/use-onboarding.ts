import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface OnboardingProgress {
  started: boolean;
  assessmentComplete: boolean;
  profileSetupComplete: boolean;
  achievementUnlocked: boolean;
  completedAt?: string;
  overallProgress: number;
}

export function useOnboardingRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Skip checks for onboarding routes
      if (pathname?.startsWith('/onboarding') || pathname?.startsWith('/auth')) {
        setChecked(true);
        return;
      }

      // Skip if not authenticated
      if (status !== 'authenticated' || !session?.user) {
        setChecked(true);
        return;
      }

      try {
        const res = await fetch('/api/onboarding/complete');
        if (res.ok) {
          const data = (await res.json()) as OnboardingProgress;

          // Redirect to onboarding if not completed
          if (!data.completedAt && pathname !== '/onboarding') {
            router.push('/onboarding');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setChecked(true);
      }
    };

    if (status === 'authenticated') {
      checkOnboardingStatus();
    } else if (status === 'unauthenticated') {
      setChecked(true);
    }
  }, [session, status, pathname, router]);

  return checked;
}

export async function getOnboardingProgress(userId: string): Promise<OnboardingProgress | null> {
  try {
    const res = await fetch('/api/onboarding/complete');
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error('Error fetching onboarding progress:', error);
  }
  return null;
}
