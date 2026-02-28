import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Award, ExternalLink, CheckCircle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const SAMPLE_CERTS = [
  { id: '1', course: 'Introduction to Solana', date: '2025-01-15', txHash: '5xG9...kL2m', level: 'Beginner', xp: 1000 },
  { id: '2', course: 'Anchor Framework', date: '2025-02-01', txHash: '8rT3...nP7q', level: 'Intermediate', xp: 1500 },
  { id: '3', course: 'DeFi on Solana', date: '2025-02-20', txHash: '2mK7...vR4s', level: 'Advanced', xp: 2000 },
];

const LEVEL_COLORS: Record<string, string> = {
  Beginner: 'bg-green-900/60 text-green-300 border border-green-700',
  Intermediate: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700',
  Advanced: 'bg-red-900/60 text-red-300 border border-red-700',
};

export default async function CertificatesHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('certificates');

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600">
            <Award className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
          <p className="text-gray-400">{t('description')}</p>
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-center">
            <div className="text-2xl font-bold text-white">{SAMPLE_CERTS.length}</div>
            <div className="text-sm text-gray-400">{t('total_earned')}</div>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{SAMPLE_CERTS.reduce((s, c) => s + c.xp, 0).toLocaleString()}</div>
            <div className="text-sm text-gray-400">XP</div>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Shield className="h-5 w-5 text-green-400" />
              <span className="text-2xl font-bold text-green-400">100%</span>
            </div>
            <div className="text-sm text-gray-400">{t('verified')}</div>
          </div>
        </div>

        <div className="space-y-4">
          {SAMPLE_CERTS.map((cert) => (
            <Link key={cert.id} href={`/${locale}/certificates/${cert.id}`}>
              <div className="group rounded-xl border border-gray-800 bg-gray-900/60 p-5 hover:border-purple-700 hover:bg-gray-900 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">{cert.course}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', LEVEL_COLORS[cert.level])}>{cert.level}</span>
                      <span>+{cert.xp.toLocaleString()} XP</span>
                      <span>{cert.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-purple-400 transition-colors">
                    <span className="font-mono">{cert.txHash}</span>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
