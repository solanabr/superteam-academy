import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="container mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground mt-3">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link href="/" className="text-primary mt-6 underline underline-offset-4">
        Go back home
      </Link>
    </main>
  );
}
