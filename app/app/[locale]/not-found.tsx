import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-solana-purple/20 bg-solana-purple/5">
        <span className="font-mono text-3xl font-black text-solana-purple">404</span>
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-content">Page not found</h1>
        <p className="mt-2 text-sm text-content-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg bg-solana-gradient px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
      >
        Browse Courses
      </Link>
    </div>
  );
}
