export default function LeaderboardLoading() {
  return (
    <div style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/* Header */}
      <div style={{ padding: "140px 40px 40px" }}>
        <div className="h-20 w-80 max-w-full rounded bg-[var(--c-bg-elevated)] animate-pulse" />
        <div className="h-3 w-64 max-w-full rounded bg-[var(--c-bg-elevated)] animate-pulse mt-6" />
      </div>

      {/* Time filter */}
      <div style={{ padding: "0 40px 48px", display: "flex", gap: "24px" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-4 w-20 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
        ))}
      </div>

      {/* Leader entries */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          style={{
            padding: "40px",
            borderTop: "1px solid var(--c-border-subtle)",
            display: "flex",
            alignItems: "baseline",
            gap: "24px",
          }}
        >
          <div className="h-4 w-6 rounded bg-[var(--c-bg-elevated)] animate-pulse shrink-0" />
          <div
            className="h-8 rounded bg-[var(--c-bg-elevated)] animate-pulse"
            style={{ width: `${140 + (i % 4) * 30}px` }}
          />
          <div className="h-6 w-16 rounded bg-[var(--c-bg-elevated)] animate-pulse ml-auto shrink-0" />
        </div>
      ))}
    </div>
  );
}
