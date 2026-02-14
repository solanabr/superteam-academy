type XPBarProps = {
  value: number;
  max: number;
  showLabel?: boolean;
};

export function XPBar({ value, max, showLabel = true }: XPBarProps): JSX.Element {
  const safeMax = Math.max(1, max);
  const percent = Math.max(0, Math.min(100, Math.floor((value / safeMax) * 100)));

  return (
    <div className="space-y-1.5">
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            background: "linear-gradient(90deg, #9945FF 0%, #14F195 100%)",
          }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-muted-foreground">{percent}% to next level</p>
      )}
    </div>
  );
}
