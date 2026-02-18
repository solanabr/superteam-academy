'use client';

import { useI18n } from '@/lib/i18n/context';
import { Navbar } from '@/components/navbar';
import { calculateLevel, levelProgress } from '@/lib/services/interfaces';

const MOCK_PROFILE = {
  displayName: 'SolDev.sol',
  bio: 'Building on Solana 🚀 | Superteam Brasil',
  wallet: '7xKX...m3fR',
  joinedAt: '2026-01-15',
  xp: 2450,
  coursesCompleted: 3,
  socialLinks: { twitter: '@soldev', github: 'soldev', discord: 'soldev#1234' },
  skills: { Rust: 72, Anchor: 65, Frontend: 88, Security: 40, DeFi: 55, NFTs: 78 },
};

const MOCK_ACHIEVEMENTS = [
  { name: 'Primeiros Passos', icon: '🌱', description: 'Completou a primeira aula' },
  { name: 'Semana Guerreira', icon: '🔥', description: 'Streak de 7 dias' },
  { name: 'Rust Rookie', icon: '🦀', description: 'Completou curso de Rust' },
  { name: 'Early Adopter', icon: '⭐', description: 'Primeiros 100 alunos' },
  { name: 'Nota Perfeita', icon: '💯', description: 'Quiz com 100% de acerto' },
];

const MOCK_CREDENTIALS = [
  { track: 'Solana Fundamentals', level: 3, mint: '4xPQ...n8kR', issuedAt: '2026-02-01' },
  { track: 'Anchor Development', level: 2, mint: '9yRT...z4mQ', issuedAt: '2026-02-10' },
];

export default function ProfilePage() {
  const { t } = useI18n();
  const level = calculateLevel(MOCK_PROFILE.xp);
  const progress = levelProgress(MOCK_PROFILE.xp);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl p-8 mb-8 border border-purple-500/20">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-4xl">
              👤
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{MOCK_PROFILE.displayName}</h1>
              <p className="text-gray-400 mt-1">{MOCK_PROFILE.bio}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                <span>🔗 {MOCK_PROFILE.wallet}</span>
                <span>📅 {t('profile.joined')} {MOCK_PROFILE.joinedAt}</span>
              </div>
              <div className="flex items-center gap-3 mt-3">
                {MOCK_PROFILE.socialLinks.twitter && (
                  <a href="#" className="text-blue-400 hover:text-blue-300 text-sm">𝕏 {MOCK_PROFILE.socialLinks.twitter}</a>
                )}
                {MOCK_PROFILE.socialLinks.github && (
                  <a href="#" className="text-gray-400 hover:text-white text-sm">⌨️ {MOCK_PROFILE.socialLinks.github}</a>
                )}
              </div>
            </div>
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm transition-colors">
              {t('profile.edit')}
            </button>
          </div>

          {/* Level & XP */}
          <div className="mt-6 flex items-center gap-4">
            <div className="bg-purple-600/30 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold">{level}</div>
              <div className="text-xs text-gray-400">{t('dashboard.level')}</div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>{MOCK_PROFILE.xp.toLocaleString()} XP</span>
                <span>{t('dashboard.level')} {level + 1}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="bg-orange-600/30 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold">12</div>
              <div className="text-xs text-gray-400">{t('dashboard.streak')}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Skills Radar (simplified as bars) */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold mb-4">{t('profile.skills')}</h2>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
              {Object.entries(MOCK_PROFILE.skills).map(([skill, value]) => (
                <div key={skill}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{skill}</span>
                    <span className="text-gray-400">{value}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Achievements */}
            <h2 className="text-xl font-bold mt-8 mb-4">{t('profile.badges')}</h2>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-3">
              {MOCK_ACHIEVEMENTS.map((a) => (
                <div key={a.name} className="flex items-center gap-3">
                  <span className="text-2xl">{a.icon}</span>
                  <div>
                    <div className="font-medium text-sm">{a.name}</div>
                    <div className="text-xs text-gray-400">{a.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Credentials & Courses */}
          <div className="lg:col-span-2 space-y-8">
            {/* On-Chain Credentials */}
            <div>
              <h2 className="text-xl font-bold mb-4">{t('profile.credentials')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MOCK_CREDENTIALS.map((cred) => (
                  <div key={cred.mint} className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                    <div className="text-3xl mb-3">🏆</div>
                    <h3 className="font-bold">{cred.track}</h3>
                    <div className="text-sm text-purple-400 mt-1">Level {cred.level}</div>
                    <div className="text-xs text-gray-500 mt-2 font-mono">{cred.mint}</div>
                    <div className="text-xs text-gray-400 mt-1">{cred.issuedAt}</div>
                    <a href={`/certificates/${cred.mint}`} className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block">
                      {t('cert.verify')} →
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed Courses */}
            <div>
              <h2 className="text-xl font-bold mb-4">{t('profile.courses_completed')}</h2>
              <div className="space-y-3">
                {['Introdução ao Solana', 'Smart Contracts com Anchor', 'DeFi na Prática'].map((course, i) => (
                  <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{course}</h3>
                      <div className="text-sm text-green-400 mt-1">{t('courses.completed')} ✓</div>
                    </div>
                    <div className="text-right">
                      <div className="text-purple-400 font-bold">+500 XP</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
