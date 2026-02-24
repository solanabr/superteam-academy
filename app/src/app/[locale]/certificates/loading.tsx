export default function CertificatesLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-[2px] bg-[var(--c-bg-elevated)] animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-40 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
          <div className="h-3 w-64 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-4 border-y border-[var(--c-border-subtle)] py-5 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-1 min-w-[100px] text-center">
            <div className="h-7 w-12 rounded bg-[var(--c-bg-elevated)] animate-pulse mx-auto mb-2" />
            <div className="h-3 w-16 rounded bg-[var(--c-bg-elevated)] animate-pulse mx-auto" />
          </div>
        ))}
      </div>

      {/* Credential cards grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] aspect-[3/4] p-6 flex flex-col"
          >
            <div className="flex justify-between mb-4">
              <div className="h-5 w-16 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
              <div className="h-5 w-14 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-20 w-20 rounded-[2px] bg-[var(--c-bg-elevated)] animate-pulse mb-4" />
              <div className="h-5 w-36 rounded bg-[var(--c-bg-elevated)] animate-pulse mb-2" />
              <div className="h-3 w-28 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
            </div>
            <div className="space-y-2 border-t border-[var(--c-border-subtle)] pt-4 mt-auto">
              <div className="h-3 w-full rounded bg-[var(--c-bg-elevated)] animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
