import Link from 'next/link';
import {
  Award, CheckCircle, ExternalLink, Share2, Download,
  Zap, BookOpen, Calendar, Shield, Star
} from 'lucide-react';
import { clsx } from 'clsx';

const cn = (...args: Parameters<typeof clsx>) => clsx(args);

const CERTIFICATES: Record<string, {
  id: string;
  credentialName: string;
  learnerAddress: string;
  issueDate: string;
  coursesCompleted: string[];
  totalXP: number;
  level: number;
  skills: { name: string; score: number }[];
  mintAddress: string;
  color: string;
  track: string;
  verifyUrl: string;
}> = {
  'cred-1': {
    id: 'cred-1',
    credentialName: 'Introdução ao Solana',
    learnerAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    issueDate: '10 de Janeiro de 2025',
    coursesCompleted: ['Introdução ao Solana'],
    totalXP: 1000,
    level: 5,
    skills: [
      { name: 'Arquitetura Solana', score: 90 },
      { name: 'Web3.js SDK', score: 85 },
      { name: 'Token Program', score: 75 },
      { name: 'PDAs', score: 70 },
      { name: 'DevOps Solana', score: 65 },
    ],
    mintAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    color: 'from-purple-600 via-indigo-600 to-blue-600',
    track: 'Solana',
    verifyUrl: 'https://explorer.solana.com/address/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU?cluster=devnet',
  },
  'cred-2': {
    id: 'cred-2',
    credentialName: 'NFTs com Metaplex',
    learnerAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    issueDate: '05 de Fevereiro de 2025',
    coursesCompleted: ['NFTs com Metaplex', 'Introdução ao Solana'],
    totalXP: 2800,
    level: 10,
    skills: [
      { name: 'Metaplex SDK', score: 92 },
      { name: 'NFT Minting', score: 88 },
      { name: 'Royalties', score: 80 },
      { name: 'Marketplace', score: 72 },
      { name: 'Metadata', score: 85 },
    ],
    mintAddress: 'Ap9SmQqLkf8fKYXJNyKLm7Lz1BqZGYTKnNmRsWVuoK4',
    color: 'from-pink-600 via-purple-600 to-indigo-600',
    track: 'NFTs',
    verifyUrl: 'https://explorer.solana.com/address/Ap9SmQqLkf8fKYXJNyKLm7Lz1BqZGYTKnNmRsWVuoK4?cluster=devnet',
  },
};

const DEFAULT_CERT = CERTIFICATES['cred-1'];

function truncate(addr: string): string {
  return addr.slice(0, 6) + '...' + addr.slice(-6);
}

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const cert = CERTIFICATES[id] ?? DEFAULT_CERT;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 py-10 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Action buttons */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/${locale}/perfil/${cert.learnerAddress}`}
            className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
          >
            ← Voltar ao Perfil
          </Link>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 hover:border-gray-600 transition-all">
              <Share2 className="h-3.5 w-3.5" />
              Compartilhar
            </button>
            <button className="flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 hover:border-gray-600 transition-all">
              <Download className="h-3.5 w-3.5" />
              Baixar PDF
            </button>
            <a
              href={cert.verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-2 text-xs font-medium text-white hover:from-purple-500 hover:to-indigo-500 transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Verificar On-Chain
            </a>
          </div>
        </div>

        {/* Certificate card */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-purple-900/30">
          {/* Background gradient */}
          <div className={cn('absolute inset-0 bg-gradient-to-br', cert.color, 'opacity-90')} />

          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full border border-white/10" />

          {/* Certificate content */}
          <div className="relative p-8 sm:p-12">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <Award className="h-7 w-7 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white/70 uppercase tracking-widest">Superteam Academy</div>
                  <div className="text-sm text-white/60">Certificado On-Chain</div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                <Shield className="h-4 w-4 text-white" />
                <span className="text-xs font-semibold text-white">Verificado</span>
              </div>
            </div>

            {/* Main content */}
            <div className="text-center mb-10">
              <p className="text-white/70 text-sm mb-2">Certificamos que</p>
              <p className="text-xl font-mono font-bold text-white/90 mb-4">
                {truncate(cert.learnerAddress)}
              </p>
              <p className="text-white/70 text-sm mb-2">completou com sucesso</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                {cert.credentialName}
              </h1>
              <p className="text-white/70 text-sm">Trilha: <span className="text-white font-semibold">{cert.track}</span></p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { icon: Zap, label: 'XP Total', value: cert.totalXP.toLocaleString() },
                { icon: Star, label: 'Nível', value: `Lv. ${cert.level}` },
                { icon: BookOpen, label: 'Cursos', value: String(cert.coursesCompleted.length) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-4 text-center">
                  <Icon className="mx-auto mb-1.5 h-5 w-5 text-white/80" />
                  <div className="text-xl font-extrabold text-white">{value}</div>
                  <div className="text-xs text-white/60">{label}</div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="mb-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-white/20" />
              <div className="text-xs text-white/50 font-mono">CREDENCIAL NFT</div>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            {/* Footer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-white/50 mb-0.5 flex items-center justify-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Emitido em
                </div>
                <div className="text-sm text-white font-medium">{cert.issueDate}</div>
              </div>
              <div>
                <div className="text-xs text-white/50 mb-0.5">ID da Credencial</div>
                <div className="text-xs text-white/80 font-mono">{cert.id.toUpperCase()}</div>
              </div>
              <div>
                <div className="text-xs text-white/50 mb-0.5">Mint Address</div>
                <div className="text-xs text-white/80 font-mono">{truncate(cert.mintAddress)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Skills section */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
            <h3 className="mb-4 text-sm font-semibold text-white flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" />
              Habilidades Demonstradas
            </h3>
            <div className="space-y-3">
              {cert.skills.map(({ name, score }) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-300">{name}</span>
                    <span className="text-xs text-gray-400">{score}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
            <h3 className="mb-4 text-sm font-semibold text-white flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-400" />
              Cursos Incluídos
            </h3>
            <div className="space-y-2 mb-6">
              {cert.coursesCompleted.map((course) => (
                <div key={course} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                  <span className="text-sm text-gray-300">{course}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-800 pt-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Verificar Autenticidade</h4>
              <a
                href={cert.verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-purple-700/50 bg-purple-900/20 px-4 py-3 text-sm font-medium text-purple-300 hover:bg-purple-900/30 hover:border-purple-600/50 transition-all"
              >
                <ExternalLink className="h-4 w-4" />
                Ver NFT no Solana Explorer
              </a>
              <p className="mt-2 text-xs text-gray-600">
                Mint: <span className="font-mono text-gray-500">{cert.mintAddress.slice(0, 20)}...</span>
              </p>
            </div>
          </div>
        </div>

        {/* Social share */}
        <div className="mt-6 rounded-2xl border border-gray-800 bg-gray-900/40 p-5 text-center">
          <p className="text-sm text-gray-400 mb-4">
            Compartilhe sua conquista com a comunidade! 🎉
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: 'Twitter / X', emoji: '🐦', color: 'border-blue-800/50 bg-blue-900/10 text-blue-300 hover:bg-blue-900/20' },
              { label: 'LinkedIn', emoji: '💼', color: 'border-blue-700/50 bg-blue-800/10 text-blue-400 hover:bg-blue-800/20' },
              { label: 'Superteam', emoji: '⚡', color: 'border-purple-700/50 bg-purple-900/10 text-purple-300 hover:bg-purple-900/20' },
              { label: 'Copiar Link', emoji: '🔗', color: 'border-gray-700 bg-gray-800/40 text-gray-300 hover:bg-gray-800' },
            ].map(({ label, emoji, color }) => (
              <button
                key={label}
                className={cn('flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all', color)}
              >
                <span>{emoji}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
