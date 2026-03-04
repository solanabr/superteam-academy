export function EmptyState({
  title,
  message,
}: {
  title: string;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-lg font-medium text-gray-300 mb-2">{title}</p>
      {message && <p className="text-sm text-gray-500">{message}</p>}
    </div>
  );
}
