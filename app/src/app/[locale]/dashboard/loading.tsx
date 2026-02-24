export default function DashboardLoading() {
  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>
      {/* Hero stats row */}
      <div style={{ padding: "120px 40px 40px" }}>
        <div className="h-10 w-64 rounded bg-[var(--c-bg-elevated)] animate-pulse mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-5"
            >
              <div className="h-8 w-20 rounded bg-[var(--c-bg-elevated)] animate-pulse mb-2" />
              <div className="h-3 w-16 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div style={{ padding: "0 40px 80px" }}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="h-5 w-40 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded bg-[var(--c-bg-elevated)] animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
                    <div className="h-2 w-full rounded bg-[var(--c-bg-elevated)] animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-5">
              <div className="h-4 w-32 rounded bg-[var(--c-bg-elevated)] animate-pulse mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
