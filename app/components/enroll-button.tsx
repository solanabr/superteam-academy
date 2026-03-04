"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { onChainEnrollmentAction } from "@/lib/services";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

interface EnrollButtonProps {
  courseSlug: string;
  t: (key: string) => string;
}

export function EnrollButton({ courseSlug, t }: EnrollButtonProps) {
  const { address, authenticated, login } = useWallet();
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  const handleEnroll = async () => {
    if (!authenticated || !address) {
      login();
      return;
    }

    setEnrolling(true);
    try {
      const result = await onChainEnrollmentAction.enroll(courseSlug);
      if (result.success) {
        setEnrolled(true);
      }
    } catch (error) {
      console.error("Enrollment failed:", error);
    } finally {
      setEnrolling(false);
    }
  };

  if (enrolled) {
    return (
      <Button size="lg" className="w-full" disabled>
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="mr-2" />
        {t("common.enrolled")}
      </Button>
    );
  }

  return (
    <Button 
      size="lg" 
      className="w-full"
      onClick={handleEnroll}
      disabled={enrolling}
    >
      {enrolling ? t("common.enrolling") : t("common.enrollNow")}
      <HugeiconsIcon
        icon={ArrowRight02Icon}
        size={14}
        data-icon="inline-end"
      />
    </Button>
  );
}
