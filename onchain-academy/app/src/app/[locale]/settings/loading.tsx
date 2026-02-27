export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-7 w-32 rounded bg-[var(--c-bg-elevated)] animate-pulse mb-8" />

      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        {/* Sidebar nav */}
        <div className="hidden lg:flex lg:flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-full rounded bg-[var(--c-bg-elevated)] animate-pulse" />
          ))}
        </div>

        {/* Form area */}
        <div className="flex flex-col gap-8 max-w-2xl">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-24 rounded bg-[var(--c-bg-elevated)] animate-pulse mb-4" />
              <div className="rounded-xl border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-6 space-y-4">
                <div className="h-10 w-full rounded bg-[var(--c-bg-elevated)] animate-pulse" />
                <div className="h-10 w-full rounded bg-[var(--c-bg-elevated)] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
