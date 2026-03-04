export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
      style={{
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.25)",
        color: "#fca5a5",
      }}
    >
      <span className="shrink-0 font-bold mt-px" aria-hidden="true">
        ✗
      </span>
      <span>{message}</span>
    </div>
  );
}
