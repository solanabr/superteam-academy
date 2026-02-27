"use client";

import { useEffect } from "react";
import { PageError } from "@/components/ui/page-error";

export default function CommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Community error:", error);
  }, [error]);

  return <PageError section="community" reset={reset} />;
}
