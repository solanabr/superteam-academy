export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 animate-pulse">
      <div className="mb-8 h-9 w-40 rounded bg-card" />
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl border border-edge-soft bg-card" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl border border-edge-soft bg-card" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-48 rounded-2xl border border-edge-soft bg-card" />
          <div className="h-32 rounded-2xl border border-edge-soft bg-card" />
        </div>
      </div>
    </div>
  );
}
