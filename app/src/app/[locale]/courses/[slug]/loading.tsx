export default function CourseLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="glass-panel flex flex-col gap-6 overflow-hidden rounded-lg border p-6 md:flex-row md:gap-8">
        <div className="shrink-0 md:w-72">
          <div className="from-solana/10 to-rust/10 flex aspect-video w-full animate-pulse items-center justify-center rounded-lg bg-gradient-to-br" />
        </div>
        <div className="flex flex-1 flex-col gap-4">
          <div className="h-4 w-24 animate-pulse rounded bg-text-secondary/20" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-text-secondary/20" />
          <div className="h-4 w-full animate-pulse rounded bg-text-secondary/20" />
          <div className="mt-2">
            <div className="h-10 w-48 animate-pulse rounded bg-text-secondary/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
