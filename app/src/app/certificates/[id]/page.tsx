import { ShareActions } from "@/components/certificate/share-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockCredentials, mockCourses } from "@/lib/data/mock-courses";
import { CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const credential = mockCredentials.find((item) => item.id === id);

  if (!credential) {
    notFound();
  }

  const course = mockCourses.find((item) => item.id === credential.courseId);
  const shareUrl = `https://superteam.academy/certificates/${credential.id}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="rounded-2xl border border-white/10 bg-zinc-900/70 p-6">
        <h1 className="text-3xl font-semibold text-zinc-100">{credential.title}</h1>
        <p className="mt-2 text-zinc-300">Issued by {credential.issuer}</p>
        <p className="text-sm text-zinc-500">Issued on {new Date(credential.issuedAt).toLocaleDateString()}</p>
      </header>

      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70 p-6">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,rgba(153,69,255,0.3),rgba(20,241,149,0.18),rgba(9,13,22,0.85))]" />
        <div className="relative rounded-xl border border-white/20 bg-[#090d16]/85 p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Superteam Academy Credential</p>
          <h2 className="mt-4 text-3xl font-semibold text-zinc-100">{credential.title}</h2>
          <p className="mt-3 max-w-2xl text-zinc-300">
            Awarded for completing the {course?.title ?? "assigned"} learning path with practical challenge submissions.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <MetaRow label="Issuer" value={credential.issuer} />
            <MetaRow label="Issued" value={new Date(credential.issuedAt).toLocaleDateString()} />
            <MetaRow label="Credential ID" value={credential.id} />
            <MetaRow label="Verification" value={credential.txSignature ? "On-chain" : "Pending"} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="space-y-3 rounded-xl border border-white/10 bg-zinc-900/70 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">On-chain verification</h2>
          <p className="text-sm text-zinc-300">
            Credential records are anchored to Solana devnet for transparent validation.
          </p>
          {credential.txSignature ? (
            <Button asChild className="w-full bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black sm:w-auto">
              <a
                href={`https://explorer.solana.com/tx/${credential.txSignature}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
              >
                Verify on Solana Explorer
                <ExternalLink className="size-4" />
              </a>
            </Button>
          ) : (
            <Badge className="w-fit border-white/15 bg-zinc-950 text-zinc-300">Signature unavailable</Badge>
          )}
        </article>

        <article className="space-y-3 rounded-xl border border-white/10 bg-zinc-900/70 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Certificate metadata</h2>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[#14F195]" />Course completed</li>
            <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#14F195]" />Security validation passed</li>
            <li>XP earned: 450</li>
            <li>Credential URI: {shareUrl}</li>
          </ul>
          <ShareActions url={shareUrl} />
        </article>
      </section>

      <Button asChild variant="outline" className="border-white/20 bg-transparent text-zinc-100">
        <Link href="/profile/you">Back to profile</Link>
      </Button>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-zinc-950/60 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-sm text-zinc-200">{value}</p>
    </div>
  );
}
