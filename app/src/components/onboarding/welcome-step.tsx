"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GraduationCap, Sparkles, Trophy, Users } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const t = useTranslations("onboarding");

  const features = [
    {
      icon: GraduationCap,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Sparkles,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      icon: Trophy,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center text-center px-2"
    >
      <div className="mb-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center"
        >
          <GraduationCap className="h-8 w-8 text-primary" />
        </motion.div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          {t("welcome")}
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {t("welcomeSubtitle")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-8">
        {features.map((feat, i) => {
          const Icon = feat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center">
                <Icon className={`h-5 w-5 ${feat.color}`} />
              </div>
              <span className="text-xs font-medium">
                {t(`welcomeFeature${i + 1}`)}
              </span>
            </motion.div>
          );
        })}
      </div>

      <Button onClick={onNext} size="lg" className="w-full max-w-sm">
        {t("getStarted")}
      </Button>
    </motion.div>
  );
}
