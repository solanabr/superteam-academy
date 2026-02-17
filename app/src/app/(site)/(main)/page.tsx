"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hero } from '@/components/shared/Hero';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/shared/AuthModal';

export default function HomePage() {
  const { t } = useLang();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <Hero />

      {/* Features Section */}
      <section className="bg-slate-50 dark:bg-gray-950 py-20 transition-colors">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Why Superteam Academy?</h2>
            <p className="text-slate-500 dark:text-gray-400">Everything you need to become a Solana native builder</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '💻',
                title: 'In-Browser IDE',
                desc: 'Write and test Rust, TypeScript, and Anchor code directly in your browser with our interactive code editor.',
              },
              {
                icon: '🎮',
                title: 'Web3 Gamification',
                desc: 'Earn XP tokens on-chain, level up your builder rank, maintain daily streaks, and unlock achievement badges.',
              },
              {
                icon: '🏆',
                title: 'cNFT Certificates',
                desc: 'Mint compressed NFT certificates via Metaplex Bubblegum upon course completion — prove your skills on-chain.',
              },
              {
                icon: '🔐',
                title: 'Multi-Auth System',
                desc: 'Connect with Phantom, Solflare, Google, or GitHub — choose your preferred authentication method.',
              },
              {
                icon: '🌍',
                title: 'Multi-Language',
                desc: 'Learn in English, Portuguese (BR), or Spanish — with more languages coming soon.',
              },
              {
                icon: '⚡',
                title: 'Clean Architecture',
                desc: 'Built with clean service interfaces ready for real Smart Contract integration on Solana Devnet.',
              },
            ].map((feat, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white dark:bg-gray-900/50 border border-slate-200 dark:border-gray-800/50 hover:border-slate-300 dark:hover:border-gray-700 transition-all group shadow-sm hover:shadow-lg dark:shadow-none"
              >
                <div className="text-3xl mb-3" aria-hidden="true">{feat.icon}</div>
                <h3 className="text-slate-900 dark:text-white font-semibold mb-2">{feat.title}</h3>
                <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-50 dark:bg-gray-950 pb-20 transition-colors">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="p-10 rounded-3xl bg-gradient-to-br from-green-50 to-yellow-50 dark:from-green-900/30 dark:to-yellow-900/30 border border-green-200 dark:border-green-500/20 shadow-lg dark:shadow-none">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Ready to Build on Solana?
            </h2>
            <p className="text-slate-500 dark:text-gray-400 mb-6">
              Join thousands of builders mastering Solana development with interactive coding challenges.
            </p>
            <button
              onClick={() => isAuthenticated ? router.push('/courses') : setAuthOpen(true)}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-yellow-400 text-gray-950 font-bold text-lg shadow-2xl shadow-green-500/25 hover:shadow-green-500/40 transition-all hover:scale-105"
            >
              Start Building Today
            </button>
          </div>
        </div>
      </section>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

