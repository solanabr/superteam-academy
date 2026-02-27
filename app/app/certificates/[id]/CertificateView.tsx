'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { getCourseBySlug } from '@/lib/data/courses';

const EXPLORER_BASE = 'https://explorer.solana.com';

export function CertificateView() {
  const params = useParams();
  const id = (params?.id as string) ?? '';
  const { publicKey } = useWallet();
  const [copied, setCopied] = useState(false);

  const course = id ? getCourseBySlug(id) : null;
  const courseName = course?.title ?? (id ? (id.length > 12 ? `Certificate ${id.slice(0, 8)}…` : `Certificate #${id}`) : 'Course completion');
  const recipient = publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : 'Recipient';
  const issuedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const verifyUrl = `${EXPLORER_BASE}/?cluster=devnet`;

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const tweetText = encodeURIComponent(
    `I completed "${courseName}" on Superteam Brazil Academy 🎓 @SuperteamBR`
  );
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(shareUrl)}`;
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  const copyLink = () => {
    if (typeof navigator === 'undefined') return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  };

  const handleDownload = () => {
    // Stub: in production use html2canvas or similar to export certificate as image
    window.print();
  };

  return (
    <div className="space-y-8">
      <div
        id="certificate-card"
        className="rounded-2xl border-2 border-accent/40 bg-surface p-8 text-center shadow-card sm:p-10"
      >
        <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-3xl" aria-hidden>
          🏆
        </div>
        <h1 className="text-2xl font-semibold text-[rgb(var(--text))] sm:text-3xl">
          Certificate of Completion
        </h1>
        <p className="text-body mt-2 font-medium text-accent">
          {courseName}
        </p>
        <p className="text-body mt-4 text-[rgb(var(--text-muted))]">
          This certifies that
        </p>
        <p className="text-title mt-1 font-semibold text-[rgb(var(--text))]">
          {recipient}
        </p>
        <p className="text-body mt-2 text-[rgb(var(--text-muted))]">
          has completed the course requirements.
        </p>
        <p className="text-caption mt-6 text-[rgb(var(--text-subtle))]">
          Issued on {issuedDate}
        </p>
        <p className="text-caption mt-2 text-[rgb(var(--text-subtle))]">
          Superteam Brazil LMS · Devnet
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <a
          href={verifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-body font-medium text-[rgb(3_7_18)] transition hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg-page))] focus-visible:outline-none"
        >
          Verify on Solana Explorer →
        </a>
        <a
          href={twitterShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-body font-medium text-[rgb(var(--text))] transition hover:bg-surface-elevated focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Share on X
        </a>
        <a
          href={linkedInShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-body font-medium text-[rgb(var(--text))] transition hover:bg-surface-elevated focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Share on LinkedIn
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-body font-medium text-[rgb(var(--text))] transition hover:bg-surface-elevated focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-body font-medium text-[rgb(var(--text))] transition hover:bg-surface-elevated focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Download as image
        </button>
      </div>

      <section className="rounded-xl border border-border/50 bg-surface p-6 text-left">
        <h2 className="text-body font-semibold text-[rgb(var(--text))]">
          NFT / on-chain details
        </h2>
        <p className="text-caption mt-2 text-[rgb(var(--text-muted))]">
          When credentials are minted on-chain, this section will show mint address, metadata URI, and ownership proof (Metaplex Core NFT, soulbound).
        </p>
        <p className="text-caption mt-2 text-[rgb(var(--text-subtle))]">
          Certificate ID: <code className="rounded bg-surface-elevated px-1.5 py-0.5">{id || '—'}</code>
        </p>
      </section>
    </div>
  );
}
