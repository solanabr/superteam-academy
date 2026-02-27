"use client";

import { useEffect } from "react";
import { PageError } from "@/components/ui/page-error";

export default function CertificatesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Certificates error:", error);
  }, [error]);

  return <PageError section="certificates" reset={reset} />;
}
