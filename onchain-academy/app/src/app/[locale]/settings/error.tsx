"use client";

import { useEffect } from "react";
import { PageError } from "@/components/ui/page-error";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Settings error:", error);
  }, [error]);

  return <PageError section="settings" reset={reset} />;
}
