'use client';

import { useState } from 'react';
import { useI18n } from '@/components/i18n/i18n-provider';
import { Credential } from '@/lib/types';

function xmlSafe(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function buildCertificateSvg(credential: Credential, title: string): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="${xmlSafe(title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#07171e" />
      <stop offset="100%" stop-color="#0e2834" />
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1dd6c0" />
      <stop offset="100%" stop-color="#5b37c8" />
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#bg)" />
  <rect x="70" y="70" width="1460" height="760" rx="32" fill="none" stroke="url(#glow)" stroke-width="3"/>
  <text x="110" y="190" fill="#9cefe6" font-family="Arial, sans-serif" font-size="34" font-weight="700">Superteam Academy Brasil</text>
  <text x="110" y="248" fill="#f7fafc" font-family="Arial, sans-serif" font-size="68" font-weight="800">${xmlSafe(credential.track)}</text>
  <text x="110" y="310" fill="#b6cad5" font-family="Arial, sans-serif" font-size="28">Wallet: ${xmlSafe(credential.walletAddress)}</text>
  <text x="110" y="360" fill="#b6cad5" font-family="Arial, sans-serif" font-size="28">Issued at: ${xmlSafe(credential.issuedAt)}</text>
  <text x="110" y="410" fill="#b6cad5" font-family="Arial, sans-serif" font-size="28">Level: ${credential.level}</text>
  <text x="110" y="680" fill="#7ea0b2" font-family="Arial, sans-serif" font-size="21">Mint: ${xmlSafe(credential.mintAddress)}</text>
  <text x="110" y="730" fill="#7ea0b2" font-family="Arial, sans-serif" font-size="21">Explorer: ${xmlSafe(credential.explorerUrl)}</text>
</svg>`.trim();
}

export function CertificatePageClient({ credential }: { credential: Credential }): JSX.Element {
  const { dictionary } = useI18n();
  const [sharing, setSharing] = useState<boolean>(false);

  function handleDownloadImage(): void {
    const svg = buildCertificateSvg(credential, dictionary.certificate.title);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `certificate-${credential.id}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleShare(): Promise<void> {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : credential.explorerUrl;
    const sharePayload = {
      title: dictionary.certificate.title,
      text: credential.track,
      url: shareUrl
    };

    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        return;
      }

      window.open(credential.explorerUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="panel">
        <h1 className="text-3xl font-extrabold">{dictionary.certificate.title}</h1>
        <p className="mt-2 text-sm text-foreground/75">{dictionary.certificate.subtitle}</p>
      </header>

      <article className="panel relative overflow-hidden p-8 shadow-lg">
        <div className="absolute -right-20 -top-16 h-44 w-44 rounded-full bg-accent/16 blur-3xl" />
        <p className="chip w-fit border-accent/30 bg-accent/10 uppercase tracking-widest text-accent">{dictionary.certificate.badge}</p>
        <h2 className="mt-2 text-3xl font-extrabold">{credential.track}</h2>
        <p className="mt-3 text-sm text-foreground/75">
          {dictionary.certificate.issuedTo} {credential.walletAddress}
        </p>
        <p className="text-sm text-foreground/75">
          {dictionary.certificate.issuedAt} {credential.issuedAt}
        </p>
        <p className="text-sm text-foreground/75">
          {dictionary.certificate.level} {credential.level}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <a href={credential.explorerUrl} target="_blank" rel="noreferrer" className="btn-primary">
            {dictionary.certificate.verifyExplorer}
          </a>
          <button type="button" onClick={handleDownloadImage} className="btn-secondary">
            {dictionary.certificate.downloadImage}
          </button>
          <button type="button" onClick={() => void handleShare()} disabled={sharing} className="btn-secondary disabled:opacity-60">
            {dictionary.certificate.share}
          </button>
        </div>
      </article>

      <section className="panel text-sm">
        <p>
          {dictionary.certificate.mintAddress}: {credential.mintAddress}
        </p>
        <p>
          {dictionary.certificate.metadataUri}: {credential.metadataUri}
        </p>
      </section>
    </div>
  );
}
