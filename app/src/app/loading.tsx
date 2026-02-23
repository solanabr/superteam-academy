import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-72 bg-zinc-800" />
      <Skeleton className="h-36 w-full bg-zinc-800" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-56 bg-zinc-800" />
        <Skeleton className="h-56 bg-zinc-800" />
      </div>
    </div>
  );
}
