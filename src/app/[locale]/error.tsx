"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <h1 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          Page error
        </h1>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          We could not render this page. You can retry or go back to courses.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold"
            style={{ background: "var(--solana-purple)", color: "#fff" }}
          >
            Retry
          </button>
          <Link
            href={`/${locale}/courses`}
            prefetch={false}
            className="text-sm underline"
            style={{ color: "var(--text-purple)" }}
          >
            Go to courses
          </Link>
        </div>
        {process.env.NODE_ENV !== "production" && (
          <pre
            className="mt-4 whitespace-pre-wrap text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            {error?.message}
          </pre>
        )}
      </div>
    </div>
  );
}

