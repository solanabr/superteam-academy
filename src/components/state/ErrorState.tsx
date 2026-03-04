export function ErrorState({
  title,
  message,
}: {
  title: string;
  message?: string;
}) {
  return (
    <div className="rounded-lg border border-red-800 bg-red-950 p-6 text-center">
      <p className="text-lg font-medium text-red-400 mb-1">{title}</p>
      {message && <p className="text-sm text-red-300/70">{message}</p>}
    </div>
  );
}
