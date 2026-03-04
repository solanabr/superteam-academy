"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
          Something went wrong
        </h1>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          Please retry. If this keeps happening, refresh the page.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold"
          style={{ background: "var(--solana-purple)", color: "#fff" }}
        >
          Try again
        </button>
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

