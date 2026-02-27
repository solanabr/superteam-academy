export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Identity header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
        <div className="h-24 w-24 rounded-[2px] bg-[var(--c-bg-elevated)] animate-pulse shrink-0" />
        <div className="flex-1 space-y-3 text-center md:text-left">
          <div className="h-7 w-48 rounded bg-[var(--c-bg-elevated)] animate-pulse mx-auto md:mx-0" />
          <div className="h-4 w-32 rounded bg-[var(--c-bg-elevated)] animate-pulse mx-auto md:mx-0" />
          <div className="h-3 w-64 max-w-full rounded bg-[var(--c-bg-elevated)] animate-pulse mx-auto md:mx-0" />
        </div>
      </div>

      {/* Stat ribbon */}
      <div className="flex flex-wrap gap-4 border-y border-[var(--c-border-subtle)] py-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-1 min-w-[100px] text-center">
            <div className="h-8 w-16 rounded bg-[var(--c-bg-elevated)] animate-pulse mx-auto mb-2" />
            <div className="h-3 w-12 rounded bg-[var(--c-bg-elevated)] animate-pulse mx-auto" />
          </div>
        ))}
      </div>

      {/* Tabs placeholder */}
      <div className="flex gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
        ))}
      </div>

      {/* Content area */}
      <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-6">
        <div className="h-64 w-full rounded bg-[var(--c-bg-elevated)] animate-pulse" />
      </div>
    </div>
  );
}
