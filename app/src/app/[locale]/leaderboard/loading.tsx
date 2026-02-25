export default function LeaderboardLoading() {
  return (
    <div style={{ background: "var(--background)", color: "var(--foreground)", contain: "layout style" }}>
      {/* Header — matches actual page header dimensions */}
      <header
        className="px-5 pt-[100px] pb-6 md:px-10 md:pt-[140px] md:pb-10"
      >
        <div
          className="rounded animate-pulse"
          style={{
            height: "clamp(48px, 8vw, 120px)",
            width: 320,
            maxWidth: "100%",
            background: "var(--c-bg-elevated)",
          }}
        />
        <div
          className="rounded animate-pulse mt-6"
          style={{
            height: 14,
            width: 200,
            maxWidth: "100%",
            background: "var(--c-bg-elevated)",
          }}
        />
      </header>

      {/* Time filter + track filter — matches actual page filter row */}
      <div
        className="px-5 pb-8 md:px-10 md:pb-12"
        style={{ display: "flex", gap: "24px", alignItems: "center" }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{
              height: 16,
              width: 80,
              background: "var(--c-bg-elevated)",
              borderRadius: 2,
            }}
          />
        ))}
        <div
          className="ml-auto animate-pulse"
          style={{
            height: 32,
            width: 140,
            background: "var(--c-bg-elevated)",
            borderRadius: 2,
          }}
        />
      </div>

      {/* Leader entries — matches actual row dimensions */}
      <div style={{ minHeight: "60vh" }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="px-5 md:px-10"
            style={{
              padding: "40px",
              borderTop: "1px solid var(--c-border-subtle)",
              display: "flex",
              alignItems: "baseline",
              gap: "24px",
            }}
          >
            <div
              className="animate-pulse shrink-0"
              style={{
                width: 20,
                height: 16,
                background: "var(--c-bg-elevated)",
                borderRadius: 2,
              }}
            />
            <div
              className="animate-pulse"
              style={{
                width: `${140 + (i % 4) * 30}px`,
                height: 32,
                background: "var(--c-bg-elevated)",
                borderRadius: 2,
              }}
            />
            <div
              className="animate-pulse ml-auto shrink-0"
              style={{
                width: 64,
                height: 24,
                background: "var(--c-bg-elevated)",
                borderRadius: 2,
              }}
            />
          </div>
        ))}
      </div>

      {/* Your position section — matches actual page footer */}
      <div
        style={{
          padding: "80px 40px",
          textAlign: "center",
          borderTop: "1px solid var(--c-border-subtle)",
        }}
        className="!px-5 !py-12 md:!px-10 md:!py-20"
      >
        <div
          className="rounded animate-pulse mx-auto"
          style={{ height: 14, width: 120, background: "var(--c-bg-elevated)" }}
        />
        <div
          className="rounded animate-pulse mx-auto mt-4"
          style={{ height: "clamp(48px, 8vw, 96px)", width: 100, background: "var(--c-bg-elevated)" }}
        />
        <div
          className="rounded animate-pulse mx-auto mt-2"
          style={{ height: 16, width: 200, background: "var(--c-bg-elevated)" }}
        />
        <div
          className="rounded animate-pulse mx-auto mt-8"
          style={{ height: 48, width: 200, background: "var(--c-bg-elevated)" }}
        />
      </div>
    </div>
  );
}
