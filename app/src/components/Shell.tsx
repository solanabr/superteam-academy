import Link from "next/link";

const nav = [
  { href: "/courses", label: "Courses" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/settings", label: "Settings" },
  { href: "/me", label: "Profile" },
];

export function Shell({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-semibold">
            Superteam Academy
          </Link>
          <nav className="hidden items-center gap-4 text-sm md:flex">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="text-zinc-700">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <Link className="underline" href="/login">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        {title ? (
          <div className="mb-8">
            <h1 className="text-3xl font-semibold">{title}</h1>
            {subtitle ? (
              <p className="mt-2 text-sm text-zinc-600">{subtitle}</p>
            ) : null}
          </div>
        ) : null}
        {children}
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-8 text-xs text-zinc-500">
          Open-source LMS scaffold • PR #13
        </div>
      </footer>
    </div>
  );
}
