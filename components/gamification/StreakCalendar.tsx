type StreakCalendarProps = {
  activeDays: string[];
};

const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

export function StreakCalendar({ activeDays }: StreakCalendarProps): JSX.Element {
  const set = new Set(activeDays);
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const items = Array.from({ length: 14 }).map((_, index) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (13 - index));
    const key = d.toISOString().slice(0, 10);
    return { key, active: set.has(key), isToday: key === todayKey, dayIndex: d.getDay() };
  });

  return (
    <div className="space-y-2">
      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1.5">
        {dayLabels.map((label, i) => (
          <span key={i} className="text-center text-[10px] font-medium text-muted-foreground">
            {label}
          </span>
        ))}
      </div>
      {/* Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {items.map((item) => (
          <div
            key={item.key}
            className={`relative flex h-8 items-center justify-center rounded-md border text-xs transition-colors ${
              item.isToday && item.active
                ? "border-solana-green bg-solana-green/20 font-bold text-solana-green"
                : item.active
                  ? "border-solana-green/40 bg-solana-green/10 text-solana-green"
                  : "border-border bg-muted/30 text-muted-foreground/50"
            }`}
            title={item.key}
          >
            {item.active ? "\u2713" : "\u00B7"}
            {item.isToday && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-solana-green" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
