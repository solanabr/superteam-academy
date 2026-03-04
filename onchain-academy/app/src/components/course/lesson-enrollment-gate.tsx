"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/stores/wallet-store";
import { getLearnerId } from "@/lib/learner";
import { backendClient } from "@/lib/backend/client";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-client";
import { onEnrollmentUpdated } from "@/lib/enrollment-sync";

type Props = {
  courseId: string;
  courseSlug: string;
};

export function LessonEnrollmentGate({ courseId, courseSlug }: Props) {
  const walletAddress = useWalletStore((state) => state.walletAddress);
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [authUser, setAuthUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [enrollmentSyncTick, setEnrollmentSyncTick] = useState(0);

  useEffect(() => {
    if (!supabase) {
      setAuthResolved(true);
      return;
    }
    supabase.auth
      .getSession()
      .then(({ data }) => {
        const user = data.session?.user;
        setAuthUser(user ? { id: user.id, email: user.email } : null);
      })
      .finally(() => setAuthResolved(true));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setAuthUser(user ? { id: user.id, email: user.email } : null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    return onEnrollmentUpdated(() => setEnrollmentSyncTick((value) => value + 1));
  }, []);

  useEffect(() => {
    const check = async () => {
      if (!authResolved) return;
      const learnerId = getLearnerId(walletAddress, authUser ?? undefined);
      try {
        const remote = await backendClient.getEnrollment(learnerId, courseId);
        setAllowed(Boolean(remote?.enrolled));
      } catch {
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [authResolved, walletAddress, authUser, courseId, enrollmentSyncTick]);

  if (loading || allowed) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-lg rounded-[24px] bg-surface border border-white/10 p-7 apple-shadow text-center">
        <h2 className="text-[28px] font-bold tracking-tight text-white mb-3">Enroll to unlock this lesson</h2>
        <p className="text-[15px] text-white/50 mb-6">
          You need to enroll in this course first. Enrollment will unlock all modules and XP tracking.
        </p>
        <Link href={`/courses/${courseSlug}`}>
          <Button variant="default" size="lg" className="rounded-full px-8">
            Go to course and enroll
          </Button>
        </Link>
      </div>
    </div>
  );
}
