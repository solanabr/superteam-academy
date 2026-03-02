"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

interface CompletionButtonProps {
  courseId: string;
  lessonIndex: number;
  isCompleted: boolean;
  xpReward: number;
  onComplete?: () => void;
}

export function CompletionButton({
  courseId,
  lessonIndex,
  isCompleted,
  xpReward,
  onComplete,
}: CompletionButtonProps) {
  const t = useTranslations("lessons");
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Simulated — in production this hits the backend API
      await new Promise((r) => setTimeout(r, 1000));
      toast.success(`+${xpReward} XP`, {
        description: t("lessonCompleted"),
      });
      onComplete?.();
    } catch {
      toast.error(t("completionError"));
    } finally {
      setLoading(false);
    }
  };

  if (isCompleted) {
    return (
      <Button disabled variant="outline" className="w-full">
        <CheckCircle2 className="h-4 w-4 mr-2 text-superteam-green" />
        {t("completed")}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleComplete}
      disabled={loading}
      className="w-full bg-gradient-to-r from-superteam-purple to-superteam-green hover:opacity-90"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Zap className="h-4 w-4 mr-2" />
      )}
      {t("markComplete")} (+{xpReward} XP)
    </Button>
  );
}
