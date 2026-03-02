"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useTranslations } from "next-intl";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEnroll } from "@/hooks/use-enrollment";
import { toast } from "sonner";
import Link from "next/link";
import { useLocale } from "next-intl";

interface EnrollmentButtonProps {
  courseId: string;
  isEnrolled: boolean;
  isCompleted: boolean;
  nextLessonSlug?: string;
}

export function EnrollmentButton({
  courseId,
  isEnrolled,
  isCompleted,
  nextLessonSlug,
}: EnrollmentButtonProps) {
  const t = useTranslations("courses");
  const locale = useLocale();
  const { connected } = useWallet();
  const enrollMutation = useEnroll();

  if (!connected) {
    return <WalletMultiButton />;
  }

  if (isCompleted) {
    return (
      <Button disabled className="w-full" variant="outline">
        <CheckCircle2 className="h-4 w-4 mr-2 text-superteam-green" />
        {t("completed")}
      </Button>
    );
  }

  if (isEnrolled) {
    return (
      <Link href={`/${locale}/courses/${courseId}/lessons/${nextLessonSlug || "0"}`}>
        <Button className="w-full bg-gradient-to-r from-superteam-purple to-superteam-blue hover:opacity-90">
          {t("continueLearning")}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </Link>
    );
  }

  return (
    <Button
      className="w-full bg-gradient-to-r from-superteam-purple to-superteam-green hover:opacity-90"
      onClick={() => {
        enrollMutation.mutate(courseId, {
          onSuccess: () => toast.success(t("enrollSuccess")),
          onError: () => toast.error(t("enrollError")),
        });
      }}
      disabled={enrollMutation.isPending}
    >
      {enrollMutation.isPending ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : null}
      {t("enroll")}
    </Button>
  );
}
