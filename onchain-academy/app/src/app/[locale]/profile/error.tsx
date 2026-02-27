"use client";

import { useEffect } from "react";
import { PageError } from "@/components/ui/page-error";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Profile error:", error);
  }, [error]);

  return <PageError section="profile" reset={reset} />;
}
