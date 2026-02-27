"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useGamification } from '@/context/GamificationContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from '@/i18n/routing';
import { ProgressService } from '@/services/progress';
import { toast } from 'sonner';

interface StartLearningButtonProps {
  courseSlug: string;
  firstLessonId: string;
}

export function StartLearningButton({ courseSlug, firstLessonId }: StartLearningButtonProps) {
  const [loading, setLoading] = useState(false);
  const { xp } = useGamification(); // Gamification might not have wallet in this context implementation, checking file next.
  const { connected, publicKey } = useWallet(); // We should use useWallet for enrollment if GamificationContext doesn't have it.
  const router = useRouter();

  const handleStart = async () => {
      setLoading(true);
      try {
          if (publicKey) {
              await ProgressService.enrollCourse(publicKey.toString(), courseSlug);
          }
          router.push(`/courses/${courseSlug}/lessons/${firstLessonId}`);
      } catch (error) {
          console.error(error);
          toast.error("Failed to enroll");
          // Navigate anyway if error (fallback)
          router.push(`/courses/${courseSlug}/lessons/${firstLessonId}`);
      } finally {
          setLoading(false);
      }
  };

  return (
    <Button size="lg" onClick={handleStart} disabled={loading} className="w-full md:w-auto bg-[#9945FF] hover:bg-[#7e37d0] text-white">
        {loading ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
            </>
        ) : "Start Learning"}
    </Button>
  );
}
