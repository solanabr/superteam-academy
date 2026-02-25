import Link from 'next/link';
import {
  GraduationCap,
  CheckCircle,
  ExternalLink,
  Award,
  Zap,
  BookOpen,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------- mock certificate data keyed by id ----------

interface CertData {
  credentialName: string;
  track: string;
  address: string;
  issuedDate: string;
  totalXp: number;
  coursesCompleted: number;
  skills: string[];
  mintAddress: string;
  color: string;
  glowColor: string;
}

const CERT_DATA: Record<string, CertData> = {
  'cred-1': {
    credentialName: 'Introdução ao Solana',
    track: 'Solana Core',
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    issuedDate: '10 de Janeiro de 2025',
    totalXp: 1000,
    coursesCompleted: 1,
    skills: ['Contas e PDAs', 'Transações & Instruções', 'Web3.js', 'Wallets & Signers', 'Token Program'],
    mintAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    color: 'from-purple-600 via-indigo-600 to-blue-600',
    glowColor: 'shadow-purple-900/50',
  },
  'cred-2': {
    credentialName: 'Especialista em Solana',
    track: 'NFTs & Metaplex',
    address: 'Ap9Stg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosg7kLm',
    issuedDate: '05 de Fevereiro de 2025',
    totalXp: 2800,
    coursesCompleted: 3,
    skills: ['Metaplex Protocol', 'Candy Machine v3', 'Token Metadata', 'Royalties On-Chain', 'NFT Marketplaces'],
    mintAddress: 'Ap9Stg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosg7kLm',
    color: 'from-pink-600 via-purple-600 to-indigo-600',
    glowColor: 'shadow-pink-900/50',
  },
};

// Fallback for unknown IDs
const DEFAULT_CERT: CertData = {
  credentialName: 'Especialista em Solana',
  track: 'Solana Development',
  address: '2kTpMnRs8jWx4fBq1cBqHnRs1cBq4fBq1cBqHnRs1cBq',
  issuedDate: '25 de Fevereiro de 2025',
  totalXp: 3500,
  coursesCompleted: 4,
  skills: ['Solana Core', 'Anchor Framework', 'DeFi Protocols', 'NFT Standards', 'Segurança On-Chain'],
  mintAddress: '2kTpMnRs8jWx4fBq1cBqHnRs1cBq4fBq1cBqHnRs1cBq',
  color: 'from-purple-600 via-indigo-600 to-blue-600',
  glowColor: 'shadow-purple-900/50',
};

function truncate(addr: string): string {
  if (addr.length <= 14) return addr;
  return addr.slice(0, 6) + '...' + addr.slice(-6);
}

function buildTwitterIntent(name: string): string {
  const text = encodeURIComponent(
    `Acabei de conquistar o certificado "${name}" na @SuperteamBR Academy! 🎓\n\nAprendendo Solana e Web3 na prática.\n\n#Solana #Web3 #Blockchain`
  );
  return `https://twitter.com/intent/tweet?text=${text}`;
}

function buildLinkedInIntent(name: string): string {
  const text = encodeURIComponent(
    `Conquista: "${name}" — Superteam Academy`
  );
  return `https://www.linkedin.com/shareArticle?mini=true&title=${text}`;
}

// ---------- page ----------

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;

  const cert = CERT_DATA[id] ?? DEFAULT_CERT;

  const explorerUrl = `https://explorer.solana.com/address/${cert.mintAddress}?cluster=devnet`;
  const twitterUrl  = buildTwitterIntent(cert.credentialName);
  const linkedinUrl = buildLinkedInIntent(cert.credentialName);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 py-10 px-4">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Back link */}
        <Link
          href={`/${locale}/perfil/${cert.address}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          ← Voltar ao perfil
        </Link>

        {/* Certificate card */}
        <div
          className={cn(
            'relative rounded-3xl border border-gray-700/50 bg-gray-900 overflow-hidden',
            'shadow-2xl',
            cert.glowColor
          )}
        >
          {/* Gradient glow ring */}
          <div
            className={cn(
              'absolute inset-0 rounded-3xl opacity-20 blur-xl bg-gradient-to-br pointer-events-none',
              cert.color
            )}
          />

          {/* Gradient header bar */}
          <div className={cn('relative h-3 bg-gradient-to-r', cert.color)} />

          <div className="relative px-8 py-10 sm:px-12 sm:py-12">

            {/* Top label + icon */}
            <div className="flex flex-col items-center text-center mb-8">
              <div
                className={cn(
                  'flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br mb-4 shadow-lg',
                  cert.color
                )}
              >
                <GraduationCap className="h-8 w-8 text-white" />
              </div>

              <p className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">
                Superteam Academy
              </p>
              <p className="text-xs font-semibold tracking-[0.15em] text-purple-400 uppercase">
                Certificado de Conclusão
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-800 mb-8" />

            {/* Credential name */}
            <div className="text-center mb-8">
              <p className="text-sm text-gray-500 mb-2">Este certificado é conferido a</p>
              <p className="font-mono text-base text-gray-300 mb-4">
                {truncate(cert.address)}
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-2">
                {cert.credentialName}
              </h1>
              <p className="text-sm text-gray-400">Track: {cert.track}</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'XP Total',          value: cert.totalXp.toLocaleString(),    icon: Zap,      color: 'text-yellow-400' },
                { label: 'Cursos Concluídos', value: String(cert.coursesCompleted),    icon: BookOpen, color: 'text-blue-400'   },
                { label: 'Track',             value: cert.track.split(' ')[0],         icon: Award,    color: 'text-green-400'  },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="rounded-xl border border-gray-800 bg-gray-950/60 p-4 text-center"
                >
                  <Icon className={cn('mx-auto mb-1.5 h-5 w-5', color)} />
                  <div className="text-lg font-extrabold text-white leading-tight">{value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="rounded-xl border border-gray-800 bg-gray-950/40 p-5 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Habilidades Certificadas</h3>
              </div>
              <ul className="space-y-2">
                {cert.skills.map((skill) => (
                  <li key={skill} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                    {skill}
                  </li>
                ))}
              </ul>
            </div>

            {/* Verify On-Chain */}
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5',
                'bg-gradient-to-r font-bold text-white text-sm',
                'hover:opacity-90 active:scale-[0.98] transition-all shadow-lg',
                cert.color
              )}
            >
              <ExternalLink className="h-4 w-4" />
              Verificar On-Chain — Solana Explorer
            </a>

            {/* Share buttons */}
            <div className="flex gap-3 mt-4">
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:border-sky-600/50 hover:text-sky-400 hover:bg-sky-900/20 transition-all"
              >
                {/* X / Twitter logo */}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.734-8.845L1.254 2.25H8.08l4.253 5.623zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Twitter / X
              </a>
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:border-blue-600/50 hover:text-blue-400 hover:bg-blue-900/20 transition-all"
              >
                {/* LinkedIn logo */}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-800 mt-8 mb-6" />

            {/* Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-gray-700" />
                <span>Emitido pela Superteam Academy</span>
              </div>
              <span>{cert.issuedDate}</span>
              <span className="font-mono text-gray-700 text-[10px]">
                {cert.mintAddress.slice(0, 8)}...{cert.mintAddress.slice(-8)}
              </span>
            </div>
          </div>

          {/* Bottom gradient bar */}
          <div className={cn('relative h-1 bg-gradient-to-r opacity-60', cert.color)} />
        </div>

        {/* Helper note */}
        <p className="text-center text-xs text-gray-700">
          Este certificado está permanentemente registrado na blockchain Solana e pode ser verificado publicamente a qualquer momento.
        </p>
      </div>
    </div>
  );
}
