export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 animate-pulse">
      <div className="mb-8 space-y-2">
        <div className="h-9 w-40 rounded bg-card" />
        <div className="h-4 w-32 rounded bg-card" />
      </div>
      <div className="mb-4 flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-lg bg-card" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border border-edge-soft bg-card p-3">
            <div className="h-6 w-6 rounded bg-surface-secondary" />
            <div className="h-4 w-32 rounded bg-surface-secondary" />
            <div className="ml-auto h-4 w-16 rounded bg-surface-secondary" />
          </div>
        ))}
      </div>
    </div>
  );
}
