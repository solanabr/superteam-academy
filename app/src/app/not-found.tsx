import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-white/10 bg-zinc-900/70 p-8 text-center">
      <h1 className="text-2xl font-semibold text-zinc-100">Page not found</h1>
      <p className="mt-2 text-zinc-400">The route you requested does not exist in this academy workspace.</p>
      <Link href="/" className="mt-4 inline-block text-[#14F195] hover:underline">
        Return home
      </Link>
    </div>
  );
}
