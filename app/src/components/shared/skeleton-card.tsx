import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function SkeletonCard() {
  return (
    <Card className="h-full overflow-hidden">
      {/* Thumbnail placeholder */}
      <Skeleton className="aspect-video w-full rounded-none rounded-t-lg" />
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-2 w-full" />
      </CardFooter>
    </Card>
  );
}
