export default function DashboardLoading() {
  return (
    <div style={{ background: "var(--background)", color: "var(--foreground)", minHeight: "100vh" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 400px",
          minHeight: "100vh",
        }}
        className="!grid-cols-1 md:!grid-cols-[1fr_400px]"
      >
        {/* Left Column — matches dashboard page left column */}
        <div
          style={{
            padding: "80px 44px 40px",
            borderRight: "1px solid var(--overlay-divider)",
          }}
          className="!p-[72px_20px_24px] md:!p-[80px_44px_40px] !border-r-0 md:!border-r md:!border-r-[var(--overlay-divider)]"
        >
          {/* Welcome heading skeleton */}
          <div className="mb-1">
            <div className="h-3 w-32 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
          </div>
          <div className="h-14 w-48 rounded bg-[var(--c-bg-elevated)] animate-pulse mb-9 md:h-[56px]" />

          {/* Stats grid skeleton — matches DashboardStatsGrid (4 cols desktop, 2 mobile) */}
          <div
            style={{ gap: 1, background: "var(--overlay-divider)", marginBottom: 32 }}
            className="grid grid-cols-2 md:grid-cols-4"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: "var(--background)", padding: "20px 16px" }}>
                <div className="h-8 w-16 rounded bg-[var(--c-bg-elevated)] animate-pulse mb-1" />
                <div className="h-3 w-20 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
              </div>
            ))}
          </div>

          {/* Current course card skeleton — matches the TiltCard (~180px height) */}
          <div
            style={{
              background: "linear-gradient(135deg, #1a1040, #0d0a25)",
              padding: 28,
              marginBottom: 28,
              minHeight: 180,
            }}
          >
            <div className="flex gap-2 mb-3">
              <div className="h-4 w-16 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
              <div className="h-4 w-20 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
            </div>
            <div className="h-7 w-64 rounded bg-[var(--c-bg-elevated)] animate-pulse mb-2" />
            <div className="h-3 w-48 rounded bg-[var(--c-bg-elevated)] animate-pulse mb-6" />
            <div className="h-[2px] w-full rounded bg-[var(--c-bg-elevated)] animate-pulse" />
            <div className="flex justify-between mt-2">
              <div className="h-3 w-24 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
              <div className="h-3 w-20 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
            </div>
          </div>

          {/* Earned credentials skeleton */}
          <div className="h-3 w-36 rounded bg-[var(--c-bg-elevated)] animate-pulse mb-3" />
          <div className="flex gap-2.5 mb-8">
            <div className="h-12 w-40 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
            <div className="h-12 w-40 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
          </div>

          {/* Up Next skeleton */}
          <div className="h-3 w-16 rounded bg-[var(--c-bg-elevated)] animate-pulse mb-3" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 0",
                borderBottom: "1px solid var(--overlay-divider)",
              }}
            >
              <div className="flex items-center gap-3.5">
                <div className="h-6 w-6 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
                <div>
                  <div className="h-4 w-32 rounded bg-[var(--c-bg-elevated)] animate-pulse mb-1" />
                  <div className="h-3 w-24 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
                </div>
              </div>
              <div className="h-5 w-16 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
            </div>
          ))}
        </div>

        {/* Right Column — matches dashboard page right column */}
        <div
          style={{
            padding: "80px 28px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
          className="!p-[24px_20px] md:!p-[80px_28px_40px] !gap-5 md:!gap-7"
        >
          {/* SeasonalEventBanner placeholder — min-height reserves space */}
          <div style={{ minHeight: 52 }}>
            <div className="h-[52px] rounded-[2px] bg-[var(--c-bg-elevated)] animate-pulse" />
          </div>

          {/* XP Orbit skeleton — matches DashboardXP */}
          <div>
            <div className="h-3 w-44 rounded bg-[var(--c-bg-elevated)] animate-pulse mb-2" />
            <div
              className="h-[260px] md:h-[340px]"
              style={{
                background: "var(--overlay-divider)",
                border: "1px solid var(--overlay-divider)",
              }}
            />
          </div>

          {/* Streak skeleton — matches DashboardStreak */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="h-3 w-28 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
              <div className="h-3 w-16 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
            </div>
            <div
              className="p-3.5 md:p-5"
              style={{
                border: "1px solid var(--overlay-divider)",
                background: "var(--overlay-divider)",
                minHeight: 105,
              }}
            >
              <div className="flex gap-[3px]">
                {Array.from({ length: 12 }).map((_, w) => (
                  <div key={w} className="flex flex-col gap-[3px]">
                    {Array.from({ length: 7 }).map((_, d) => (
                      <div
                        key={d}
                        style={{
                          width: 11,
                          height: 11,
                          borderRadius: 2,
                          background: "var(--overlay-divider)",
                          opacity: 0.5,
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats list skeleton — matches DashboardStatsList */}
          <div>
            <div className="h-3 w-20 rounded bg-[var(--c-bg-elevated)] animate-pulse mb-3" />
            <div style={{ border: "1px solid var(--overlay-divider)" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderBottom: i < 3 ? "1px solid var(--overlay-divider)" : "none",
                  }}
                >
                  <div className="h-3 w-20 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
                  <div className="h-3 w-12 rounded bg-[var(--c-bg-elevated)] animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Actions skeleton — matches DashboardActions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div className="h-[54px] bg-[var(--c-bg-elevated)] animate-pulse" />
            <div className="h-[54px] border border-[var(--overlay-divider)] animate-pulse" />
          </div>

          {/* Daily challenges skeleton */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-36 rounded-[2px] bg-[var(--c-border-subtle)] animate-pulse" />
              <div className="h-4 w-20 rounded-[2px] bg-[var(--c-border-subtle)] animate-pulse" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-[2px] bg-[var(--c-bg-card)] border border-[var(--c-border-subtle)] animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
