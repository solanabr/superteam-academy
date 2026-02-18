"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function VisibilityToggle({ isOwnProfile }: { isOwnProfile: boolean }) {
  const t = useTranslations("profile");
  const [isPublic, setIsPublic] = useState(true);
  const [toggling, setToggling] = useState(false);

  const handleToggle = useCallback(async () => {
    if (!isOwnProfile || toggling) return;
    setToggling(true);
    const newValue = !isPublic;
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilePublic: newValue }),
      });
      if (!res.ok) throw new Error();
      setIsPublic(newValue);
      toast.success(newValue ? t("public") : t("private"));
    } catch {
      toast.error("Failed to update visibility");
    } finally {
      setToggling(false);
    }
  }, [isOwnProfile, isPublic, toggling, t]);

  return (
    <Badge
      variant="outline"
      className={`${
        isPublic
          ? "border-primary/30 text-primary"
          : "border-border text-muted-foreground"
      } ${isOwnProfile ? "cursor-pointer select-none transition-colors" : ""}`}
      onClick={isOwnProfile ? handleToggle : undefined}
    >
      {toggling ? "..." : isPublic ? t("public") : t("private")}
    </Badge>
  );
}
