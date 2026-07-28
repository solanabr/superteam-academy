import type { Metadata } from "next";
import { TeachPreviewClient } from "./preview-client";

export const metadata: Metadata = {
  title: "Course preview",
  robots: { index: false, follow: false },
};

/**
 * Teacher-facing course preview (#828). Everything happens client-side against
 * `/api/teach/preview*`, so this page holds no secrets and renders identically
 * before and after the password gate is satisfied.
 */
export default function TeachPreviewPage() {
  return <TeachPreviewClient />;
}
