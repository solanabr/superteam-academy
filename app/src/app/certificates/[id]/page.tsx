import Link from "next/link";
import { Shell } from "@/components/Shell";

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Shell
      title="Certificate"
      subtitle="Visual certificate + on-chain verification link (stub)"
    >
      <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
        <div className="text-xs text-zinc-500">Certificate ID</div>
        <div className="mt-1 font-mono text-sm">{id}</div>

        <div className="mt-8 text-3xl font-semibold">Solana Foundations</div>
        <div className="mt-2 text-sm text-zinc-600">
          Awarded to @yuki • 2026-02-16
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <button className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
            Download image (stub)
          </button>
          <Link
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm"
            href="https://explorer.solana.com"
            target="_blank"
          >
            Verify on Solana Explorer
          </Link>
        </div>
      </div>
    </Shell>
  );
}
