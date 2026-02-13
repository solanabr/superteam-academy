import Link from 'next/link';
import type { Route } from 'next';
import { useI18n } from '@/components/i18n/i18n-provider';
import { Credential } from '@/lib/types';

export function CredentialCard({ credential }: { credential: Credential }): JSX.Element {
  const { dictionary } = useI18n();

  return (
    <article className="panel-soft space-y-3 bg-card/70">
      <header className="flex items-center justify-between">
        <h3 className="font-semibold">{credential.track}</h3>
        <span
          className={`rounded-full border px-2 py-1 text-xs font-semibold ${
            credential.status === 'completed'
              ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-400'
              : 'border-amber-500/35 bg-amber-500/12 text-amber-400'
          }`}
        >
          {credential.status === 'completed' ? dictionary.profile.statusCompleted : dictionary.profile.statusInProgress}
        </span>
      </header>

      <p className="text-sm text-foreground/75">
        {dictionary.profile.evolutionLevelLabel}: {credential.level}
      </p>
      <p className="font-mono text-xs text-foreground/65">
        {dictionary.profile.mintLabel}: {credential.mintAddress}
      </p>

      <div className="flex gap-2">
        <a
          href={credential.explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-primary px-3 py-1.5 text-xs"
        >
          {dictionary.certificate.verifyExplorer}
        </a>

        <Link
          href={{
            pathname: `/certificates/${credential.id}` as Route,
            query: { wallet: credential.walletAddress }
          }}
          className="btn-secondary px-3 py-1.5 text-xs"
        >
          {dictionary.profile.openCertificate}
        </Link>
      </div>
    </article>
  );
}
