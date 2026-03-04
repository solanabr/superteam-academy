import Link from "next/link";
import { Shell } from "@/components/Shell";

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Shell>
      <div className="mx-auto max-w-2xl">
        <Link
          href="/dashboard"
          className="text-xs text-zinc-500 hover:underline"
        >
          ← Dashboard
        </Link>

        {/* Certificate card */}
        <div className="mt-4 rounded-3xl border-2 border-zinc-200 bg-white p-10 shadow-sm">
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest text-zinc-400">
              Certificate of Completion
            </div>
            <h1 className="mt-4 text-3xl font-semibold">Solana Foundations</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Superteam Academy
            </p>

            <div className="mx-auto mt-8 h-px w-24 bg-zinc-200" />

            <div className="mt-8">
              <div className="text-xs text-zinc-500">Awarded to</div>
              <div className="mt-1 text-lg font-semibold">@yuki (stub)</div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-xs text-zinc-500">Date</div>
                <div className="mt-1 text-sm font-medium">Feb 2026</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Score</div>
                <div className="mt-1 text-sm font-medium">92%</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Credential</div>
                <div className="mt-1 text-sm font-medium">cNFT (devnet)</div>
              </div>
            </div>

            <div className="mx-auto mt-8 h-px w-24 bg-zinc-200" />

            <div className="mt-6 rounded-xl bg-zinc-50 p-4 text-xs text-zinc-500">
              <div className="font-medium text-zinc-700">On-chain proof (stub)</div>
              <div className="mt-1 break-all font-mono">
                cert:{id}
              </div>
              <div className="mt-2">
                In production, this will be a compressed NFT on Solana devnet
                with metadata linking to course completion data.
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-center gap-3">
          <button className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white">
            Share
          </button>
          <Link
            href="/courses"
            className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm"
          >
            More courses
          </Link>
        </div>
      </div>
    </Shell>
  );
}
