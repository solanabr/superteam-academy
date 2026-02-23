import { Button } from "@/components/ui/button";
import { mockCredentials } from "@/lib/data/mock-courses";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const credential = mockCredentials.find((item) => item.id === id);

  if (!credential) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="rounded-2xl border border-white/10 bg-zinc-900/70 p-6">
        <h1 className="text-3xl font-semibold text-zinc-100">{credential.title}</h1>
        <p className="mt-2 text-zinc-300">Issued by {credential.issuer}</p>
        <p className="text-sm text-zinc-500">Issued on {new Date(credential.issuedAt).toLocaleDateString()}</p>
      </header>

      <Image
        src={credential.imageUri}
        alt={credential.title}
        width={1200}
        height={700}
        className="rounded-xl border border-white/10 object-cover"
      />

      <div className="flex gap-3">
        {credential.txSignature ? (
          <Button asChild className="bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black">
            <a
              href={`https://explorer.solana.com/tx/${credential.txSignature}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
            >
              Verify on chain
            </a>
          </Button>
        ) : null}
        <Button asChild variant="outline" className="border-white/20 bg-transparent text-zinc-100">
          <Link href="/profile/you">Back to profile</Link>
        </Button>
      </div>
    </div>
  );
}
