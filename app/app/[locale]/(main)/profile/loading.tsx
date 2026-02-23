export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 animate-pulse">
      <div className="mb-8 space-y-2">
        <div className="h-9 w-32 rounded bg-card" />
        <div className="h-4 w-24 rounded bg-card" />
      </div>
      <div className="mb-6 rounded-2xl border border-edge-soft bg-card p-6 space-y-4">
        <div className="h-14 w-48 rounded bg-surface-secondary" />
        <div className="h-2 w-full rounded-full bg-surface-secondary" />
      </div>
      <div className="mb-6 rounded-2xl border border-edge-soft bg-card p-6">
        <div className="h-[250px] w-full rounded-xl bg-surface-secondary" />
      </div>
    </div>
  );
}
