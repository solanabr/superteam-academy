import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12 text-zinc-900">
      <div className="mx-auto w-full max-w-4xl">
        <header className="flex items-center justify-between">
          <div className="font-semibold">Superteam Academy</div>
          <nav className="flex items-center gap-4 text-sm">
            <Link className="underline" href="/courses">
              Courses
            </Link>
            <Link className="underline" href="/me">
              Profile
            </Link>
            <Link className="underline" href="/login">
              Login
            </Link>
          </nav>
        </header>

        <main className="mt-12 grid gap-8 rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-semibold leading-tight">
              Learn Solana.
              <br />
              Earn proof.
              <br />
              Ship faster.
            </h1>
            <p className="mt-4 text-sm text-zinc-600">
              MVP scaffold for the Superteam Brazil LMS listing: landing → course
              catalog → auth stub → deploy notes.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
                href="/courses"
              >
                Browse courses
              </Link>
              <Link
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm"
                href="/login"
              >
                Continue (stub)
              </Link>
            </div>

            <div className="mt-8 grid gap-3 text-xs text-zinc-600">
              <div className="rounded-xl bg-zinc-50 p-4">
                <div className="font-medium text-zinc-800">Planned</div>
                <div className="mt-1">
                  Wallet link • Google sign-in • CMS • analytics
                </div>
              </div>
              <div className="rounded-xl bg-zinc-50 p-4">
                <div className="font-medium text-zinc-800">Now</div>
                <div className="mt-1">Course mocks • routing • auth stub</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
            <h2 className="text-lg font-semibold">Quick demo flow</h2>
            <ol className="mt-3 space-y-2 text-sm text-zinc-700">
              <li>1. Open the course catalog</li>
              <li>2. Click a course to see lessons</li>
              <li>3. Login (stub) to create a profile cookie</li>
            </ol>
            <div className="mt-6 text-xs text-zinc-500">
              This is deliberately simple to ship a PR quickly.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
