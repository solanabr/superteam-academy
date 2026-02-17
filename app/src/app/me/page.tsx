import Link from "next/link";
import { getUser } from "@/lib/auth";

export default async function MePage() {
  const user = await getUser();

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12 text-zinc-900">
      <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Stub profile page. Later: wallet link, XP, enrollments.
        </p>

        <div className="mt-6 rounded-xl border border-zinc-200 p-4">
          <div className="text-sm text-zinc-600">Signed in as</div>
          <div className="mt-1 font-mono text-sm">
            {user?.name ?? "(not signed in)"}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm"
            href="/courses"
          >
            Browse courses
          </Link>
          <form action="/api/auth/logout" method="post">
            <button className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white">
              Logout
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
