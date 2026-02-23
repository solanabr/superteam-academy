import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-72 bg-secondary" />
      <Skeleton className="h-36 w-full bg-secondary" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-56 bg-secondary" />
        <Skeleton className="h-56 bg-secondary" />
      </div>
    </div>
  );
}
