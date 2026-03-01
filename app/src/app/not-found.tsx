import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-8 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Page not found</h1>
      <p className="mt-2 text-muted-foreground">The route you requested does not exist in this academy workspace.</p>
      <Link href="/" className="mt-4 inline-block text-highlight hover:underline">
        Return home
      </Link>
    </div>
  );
}
