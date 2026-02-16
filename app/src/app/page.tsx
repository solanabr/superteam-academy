import Link from "next/link";
import { Shell } from "@/components/Shell";

export default function Home() {
  return (
    <Shell>
      <div className="grid gap-8 rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-semibold leading-tight">
            Learn Solana.
            <br />
            Earn proof.
            <br />
            Ship faster.
          </h1>
          <p className="mt-4 text-sm text-zinc-600">
            We’re building a production-ready LMS for Solana-native developers:
            interactive lessons, progress tracking, and verifiable on-chain
            credentials.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
              href="/courses"
            >
              Explore courses
            </Link>
            <Link
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm"
              href="/dashboard"
            >
              Go to dashboard
            </Link>
          </div>

          <div className="mt-10 grid gap-3 text-xs text-zinc-600">
            <div className="rounded-xl bg-zinc-50 p-4">
              <div className="font-medium text-zinc-800">MVP now</div>
              <div className="mt-1">
                Full routing + page shells + typed services (ready for real data)
              </div>
            </div>
            <div className="rounded-xl bg-zinc-50 p-4">
              <div className="font-medium text-zinc-800">Next</div>
              <div className="mt-1">
                Wallet + Google auth • i18n • editor • CMS • devnet reads
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
          <h2 className="text-lg font-semibold">What ships in this PR</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-700">
            <li>• 10 required routes (core UX)</li>
            <li>• Course catalog + detail + lesson view layout</li>
            <li>• Dashboard / leaderboard / settings shells</li>
            <li>• Certificates route for verifiable credential UX</li>
          </ul>
          <div className="mt-6 text-xs text-zinc-500">
            We keep the build green and iterate in small commits.
          </div>
        </div>
      </div>
    </Shell>
  );
}
