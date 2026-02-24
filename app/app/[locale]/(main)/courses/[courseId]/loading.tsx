export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 animate-pulse">
      <div className="mb-6 space-y-2">
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-card" />
          <div className="h-5 w-20 rounded bg-card" />
        </div>
        <div className="h-9 w-48 rounded bg-card" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg border border-edge-soft bg-card" />
        ))}
      </div>
      <div className="h-3 w-full rounded-full bg-card" />
      <div className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg border border-edge-soft bg-card" />
        ))}
      </div>
    </div>
  );
}
