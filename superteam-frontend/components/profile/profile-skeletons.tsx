import { Card, CardContent, CardHeader } from "@/components/ui/card";

function Pulse({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />
  );
}

export function HeaderSkeleton() {
  return (
    <Card className="overflow-hidden border-primary/20 bg-card">
      <div className="h-24 bg-gradient-to-r from-primary/25 via-primary/10 to-transparent" />
      <CardContent className="-mt-10 pb-6">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 shrink-0 animate-pulse rounded-full border-4 border-background bg-muted" />
          <div className="min-w-0 flex-1 pt-6 space-y-2">
            <Pulse className="h-6 w-40" />
            <Pulse className="h-4 w-64" />
            <Pulse className="h-4 w-32" />
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-background/40 px-3 py-2.5"
            >
              <Pulse className="h-3 w-16 mb-2" />
              <Pulse className="h-5 w-12" />
            </div>
          ))}
        </div>
        <Pulse className="mt-4 h-12 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

export function ActivitySkeleton() {
  return (
    <section>
      <Pulse className="h-5 w-20 mb-4" />
      <Card>
        <CardContent className="py-6">
          <Pulse className="h-32 w-full" />
        </CardContent>
      </Card>
    </section>
  );
}

export function CoursesSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Pulse className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-background/40 p-3 space-y-2"
          >
            <Pulse className="h-4 w-48" />
            <Pulse className="h-3 w-24" />
            <Pulse className="h-1.5 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function SkillsSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Pulse className="h-5 w-16" />
      </CardHeader>
      <CardContent>
        <Pulse className="mx-auto h-52 w-full rounded" />
        <div className="mt-3 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Pulse className="h-3 w-20 mb-1" />
              <Pulse className="h-1.5 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function BadgesSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Pulse className="h-5 w-28" />
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Pulse key={i} className="h-6 w-24 rounded-full" />
        ))}
      </CardContent>
    </Card>
  );
}

export function CredentialsSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Pulse className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Pulse className="h-20 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}
