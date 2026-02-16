import Link from "next/link";
import { Shell } from "@/components/Shell";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  return (
    <Shell title={`@${username}`} subtitle="Public profile (stub)">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:col-span-1">
          <div className="h-12 w-12 rounded-full bg-zinc-200" />
          <div className="mt-3 text-sm font-semibold">{username}</div>
          <div className="mt-1 text-xs text-zinc-500">Solana builder</div>
          <div className="mt-4 text-xs text-zinc-500">
            Next: socials, skill radar, visibility toggle.
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Credentials</div>
            <Link className="text-xs underline" href="/leaderboard">
              Leaderboard
            </Link>
          </div>
          <div className="mt-4 text-sm text-zinc-500">
            (Next: read evolving cNFT credentials from devnet + verification links)
          </div>
        </div>
      </div>
    </Shell>
  );
}
