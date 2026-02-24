export default function CoursesLoading() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--v9-near-black)", color: "var(--v9-white)" }}
    >
      {/* Header */}
      <div style={{ padding: "140px 40px 40px" }}>
        <div className="h-20 w-96 max-w-full rounded bg-white/5 animate-pulse" />
        <div className="h-3 w-72 max-w-full rounded bg-white/5 animate-pulse mt-6" />
      </div>

      {/* Search */}
      <div style={{ padding: "0 40px 12px" }}>
        <div className="h-10 w-full max-w-[480px] rounded bg-white/5 animate-pulse" />
      </div>

      {/* Filter pills */}
      <div style={{ padding: "16px 40px 0" }}>
        <div className="hidden md:flex gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-7 rounded bg-white/5 animate-pulse"
              style={{ width: `${60 + (i % 3) * 20}px` }}
            />
          ))}
        </div>
      </div>

      {/* Course rows */}
      <div style={{ marginTop: 40 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: "48px 40px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex gap-4 mb-4">
              <div className="h-3 w-20 rounded bg-white/5 animate-pulse" />
              <div className="h-3 w-16 rounded bg-white/5 animate-pulse" />
              <div className="h-3 w-14 rounded bg-white/5 animate-pulse" />
            </div>
            <div className="h-12 w-3/4 max-w-xl rounded bg-white/5 animate-pulse mb-4" />
            <div className="h-5 w-full max-w-lg rounded bg-white/5 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
