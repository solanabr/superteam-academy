export default function Loading() {
  return (
    <div className="px-4 py-8 animate-pulse">
      <div className="mx-auto mb-6 flex max-w-7xl items-center gap-2">
        <div className="h-4 w-24 rounded bg-card" />
        <span className="text-content-muted">/</span>
        <div className="h-4 w-16 rounded bg-card" />
      </div>
      <div className="mx-auto mb-6 max-w-7xl">
        <div className="h-8 w-56 rounded bg-card" />
      </div>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-4 w-full rounded bg-card" />
        <div className="h-4 w-5/6 rounded bg-card" />
        <div className="h-4 w-4/6 rounded bg-card" />
        <div className="h-48 w-full rounded-xl border border-edge-soft bg-card" />
      </div>
    </div>
  );
}
