import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12 text-zinc-900">
      <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Login (stub)</h1>
        <p className="mt-2 text-sm text-zinc-600">
          This is a temporary auth stub. It sets an httpOnly cookie so we can
          iterate on UX without committing to a provider yet.
        </p>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Please enter a name.
          </p>
        ) : null}

        <form className="mt-6 space-y-3" method="post" action="/api/auth/login">
          <label className="block">
            <span className="text-sm font-medium">Display name</span>
            <input
              name="name"
              placeholder="yuki"
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
            />
          </label>
          <button className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
            Continue
          </button>
        </form>

        <div className="mt-6 text-sm">
          <Link className="text-zinc-700 underline" href="/">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
