export function GridBackground({
  children,
  className = "",
  variant = "dots",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "dots" | "lines";
}) {
  return (
    <div className={`relative ${className}`}>
      <div
        className={`absolute inset-0 ${variant === "dots" ? "bg-grid-dots" : "bg-grid-lines"}`}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      <div className="relative">{children}</div>
    </div>
  );
}
