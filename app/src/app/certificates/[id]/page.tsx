'use client';

import { useParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { Navbar } from '@/components/navbar';

const MOCK_CERT = {
  courseName: 'Introdução ao Solana',
  courseTrack: 'Solana Fundamentals',
  level: 3,
  recipient: 'SolDev.sol',
  wallet: '7xKXmN9z...m3fR',
  mintAddress: '4xPQvL8nT2kR9yW6mJ3sQfNbX7cZ5dH1aG8eF0pU',
  issuedAt: '2026-02-01',
  explorerUrl: 'https://explorer.solana.com/address/4xPQvL8nT2kR9yW6mJ3sQfNbX7cZ5dH1aG8eF0pU?cluster=devnet',
  metadata: {
    name: 'Superteam Academy — Solana Fundamentals Level 3',
    symbol: 'STCERT',
    description: 'Compressed NFT certificate for completing Solana Fundamentals track at Level 3',
    image: '',
    attributes: [
      { trait_type: 'Track', value: 'Solana Fundamentals' },
      { trait_type: 'Level', value: '3' },
      { trait_type: 'XP Earned', value: '1500' },
      { trait_type: 'Lessons Completed', value: '24' },
      { trait_type: 'Quizzes Passed', value: '6' },
    ],
  },
};

export default function CertificatePage() {
  const { t } = useI18n();
  const params = useParams();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Certificate Card */}
        <div className="bg-gradient-to-br from-purple-900/60 via-blue-900/40 to-purple-900/60 rounded-2xl p-1 mb-8">
          <div className="bg-gray-950 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <div className="text-sm text-purple-400 uppercase tracking-widest mb-2">Superteam Academy</div>
            <h1 className="text-3xl font-bold mb-2">{t('cert.title')}</h1>
            <div className="text-gray-400 mb-6">{MOCK_CERT.courseTrack} — Level {MOCK_CERT.level}</div>

            <div className="border-t border-b border-gray-800 py-6 my-6">
              <div className="text-sm text-gray-400">{t('cert.issued_to')}</div>
              <div className="text-2xl font-bold mt-1">{MOCK_CERT.recipient}</div>
              <div className="text-sm text-gray-500 font-mono mt-1">{MOCK_CERT.wallet}</div>
            </div>

            <div className="text-sm text-gray-400">
              {t('cert.issued_on')}: {MOCK_CERT.issuedAt}
            </div>

            {/* Attributes */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {MOCK_CERT.metadata.attributes.map((attr) => (
                <div key={attr.trait_type} className="bg-gray-900 rounded-lg p-3">
                  <div className="text-xs text-gray-400">{attr.trait_type}</div>
                  <div className="font-bold text-sm mt-1">{attr.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <a
            href={MOCK_CERT.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm transition-colors"
          >
            🔗 {t('cert.verify')}
          </a>
          <button className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
            📤 {t('cert.share')}
          </button>
          <button className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
            📥 {t('cert.download')}
          </button>
        </div>

        {/* Technical Details */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">NFT Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">{t('cert.mint_address')}</span>
              <span className="font-mono text-xs">{MOCK_CERT.mintAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Standard</span>
              <span>Compressed NFT (Bubblegum)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Network</span>
              <span>Solana Devnet</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Symbol</span>
              <span>{MOCK_CERT.metadata.symbol}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Metadata JSON</h3>
            <pre className="bg-gray-800 rounded-lg p-4 text-xs overflow-x-auto">
              {JSON.stringify(MOCK_CERT.metadata, null, 2)}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
