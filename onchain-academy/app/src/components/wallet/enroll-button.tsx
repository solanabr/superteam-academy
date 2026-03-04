"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { onchainIdentityService } from "@/services/onchain-identity-service";
import { useWalletStore } from "@/stores/wallet-store";
import { getLearnerId } from "@/lib/learner";
import { backendClient } from "@/lib/backend/client";
import { useRouter } from "@/i18n/navigation";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-client";
import { onProfileUpdated } from "@/lib/profile-sync";
import { emitEnrollmentUpdated } from "@/lib/enrollment-sync";

export function EnrollButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "enrolled">("idle");
  const [profileComplete, setProfileComplete] = useState<boolean>(false);
  const [walletLinked, setWalletLinked] = useState<boolean>(false);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [profileSyncTick, setProfileSyncTick] = useState(0);
  const connected = useWalletStore((state) => state.connected);
  const walletAddress = useWalletStore((state) => state.walletAddress);
  const submitEnrollmentTx = useWalletStore((state) => state.submitDevnetEnrollmentTransaction);
  const [authUser, setAuthUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const supabase = getSupabaseBrowserClient();

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
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    return onProfileUpdated(() => setProfileSyncTick((value) => value + 1));
  }, []);

  useEffect(() => {
    const hydrate = async () => {
      if (!authResolved) return;
      const learnerId = getLearnerId(walletAddress, authUser ?? undefined);
      setProfileLoading(true);
      try {
        const profile = await backendClient.getProfile(learnerId);
        setProfileComplete(Boolean(profile?.isComplete));
        setWalletLinked(Boolean(profile?.walletAddress));
        const remote = await backendClient.getEnrollment(learnerId, courseId);
        setStatus(remote?.enrolled ? "enrolled" : "idle");
      } catch {
        setProfileComplete(false);
        setWalletLinked(false);
        setStatus("idle");
      } finally {
        setProfileLoading(false);
      }
    };
    hydrate();
  }, [authResolved, courseId, walletAddress, authUser, profileSyncTick]);

  const handleEnroll = async () => {
    if (!profileComplete) {
      router.push("/profile");
      return;
    }
    if (!walletLinked) {
      router.push("/profile");
      return;
    }

    if (!connected || !walletAddress) {
      alert("Connect your wallet first using the wallet connect button.");
      return;
    }

    try {
      setStatus("loading");
      // Learner signs and submits a real Devnet transaction from wallet.
      const signature = await submitEnrollmentTx(courseId);
      await onchainIdentityService.enroll(courseId, walletAddress);
      const learnerId = getLearnerId(walletAddress, authUser ?? undefined);
      await backendClient.upsertEnrollment({
        learnerId,
        courseId,
        signature,
        source: "wallet",
      });
      setStatus("enrolled");
      emitEnrollmentUpdated();
    } catch (err) {
      console.error(err);
      setStatus("idle");
    }
  };

  if (status === "enrolled") {
    return <Button variant="outline" className="w-full text-[15px] font-semibold" disabled>Enrolled</Button>;
  }
  if (!profileLoading && !profileComplete) {
    return (
      <Button variant="outline" className="w-full text-[15px] font-semibold" onClick={() => router.push("/profile")}>
        Complete profile to enroll
      </Button>
    );
  }
  if (!profileLoading && !walletLinked) {
    return (
      <Button variant="outline" className="w-full text-[15px] font-semibold" onClick={() => router.push("/profile")}>
        Link wallet in profile
      </Button>
    );
  }

  return (
    <Button 
      variant="brand" 
      className="w-full text-[15px] font-semibold"
      onClick={handleEnroll} 
      disabled={status === "loading"}
    >
      {status === "loading" ? "Processing..." : connected ? "Enroll now" : "Connect wallet to enroll"}
    </Button>
  );
}
